import { getDbClient } from '@/lib/auth/userService';
import {
  RoleRequirements,
  RoadmapSourceItem,
  StudentRoadmap,
  RoadmapPhase,
  RoadmapTask,
  TaskStatus,
} from './types';

// Normalize role names into standard cache keys (e.g. "Full Stack Developer" -> "full stack developer")
export function normalizeRoleKey(role: string): string {
  return role.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Check if a fresh cache (< 14 days) exists in database for this role
 */
export async function getCachedRoleRequirements(
  role: string
): Promise<RoleRequirements | null> {
  const client = getDbClient();
  const roleKey = normalizeRoleKey(role);

  try {
    await client.connect();

    const cacheRes = await client.query(
      `
      SELECT id, role_key, requirements, fetched_at, expires_at
      FROM roadmap_role_cache
      WHERE role_key = $1 AND expires_at > NOW()
      ORDER BY fetched_at DESC
      LIMIT 1
      `,
      [roleKey]
    );

    if (cacheRes.rows.length === 0) {
      await client.end();
      return null;
    }

    const row = cacheRes.rows[0];
    const cacheId = row.id;

    // Fetch associated sources
    const sourcesRes = await client.query(
      `
      SELECT id, url, title, fetched_at
      FROM roadmap_sources
      WHERE role_cache_id = $1
      ORDER BY fetched_at ASC
      `,
      [cacheId]
    );

    const sources: RoadmapSourceItem[] = sourcesRes.rows.map((s: { id: string; url: string; title: string; fetched_at: Date | string }) => ({
      id: s.id,
      url: s.url,
      title: s.title,
      fetchedAt: s.fetched_at instanceof Date ? s.fetched_at.toISOString() : String(s.fetched_at),
    }));

    await client.end();

    const requirements = row.requirements as Partial<RoleRequirements>;
    return {
      cacheId: row.id,
      role,
      roleKey,
      fetchedAt: row.fetched_at?.toISOString?.() || String(row.fetched_at),
      expiresAt: row.expires_at?.toISOString?.() || String(row.expires_at),
      isLive: true,
      coreSkills: requirements.coreSkills || [],
      niceToHaveSkills: requirements.niceToHaveSkills || [],
      toolsAndFrameworks: requirements.toolsAndFrameworks || [],
      projectIdeas: requirements.projectIdeas || [],
      interviewTopics: requirements.interviewTopics || [],
      certifications: requirements.certifications || [],
      fresherExpectations: requirements.fresherExpectations || [],
      sources,
    };
  } catch (err) {
    console.error('Error fetching cached role requirements:', err);
    try {
      await client.end();
    } catch {}
    return null;
  }
}

/**
 * Cache newly researched role requirements and sources (14-day TTL)
 */
export async function saveRoleRequirementsCache(
  reqs: RoleRequirements
): Promise<string> {
  const client = getDbClient();
  const roleKey = normalizeRoleKey(reqs.role);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  try {
    await client.connect();

    // Upsert role cache
    const cacheRes = await client.query(
      `
      INSERT INTO roadmap_role_cache (role_key, requirements, fetched_at, expires_at)
      VALUES ($1, $2, NOW(), $3)
      ON CONFLICT (role_key) DO UPDATE
      SET requirements = EXCLUDED.requirements,
          fetched_at = NOW(),
          expires_at = EXCLUDED.expires_at
      RETURNING id
      `,
      [roleKey, JSON.stringify(reqs), expiresAt]
    );

    const cacheId = cacheRes.rows[0].id;

    // Delete existing sources for this cacheId and reinsert fresh
    await client.query('DELETE FROM roadmap_sources WHERE role_cache_id = $1', [cacheId]);

    for (const src of reqs.sources) {
      if (src.url) {
        await client.query(
          `
          INSERT INTO roadmap_sources (role_cache_id, url, title, fetched_at)
          VALUES ($1, $2, $3, NOW())
          `,
          [cacheId, src.url, src.title || src.url]
        );
      }
    }

    await client.end();
    return cacheId;
  } catch (err) {
    console.error('Error saving role requirements cache:', err);
    try {
      await client.end();
    } catch {}
    throw err;
  }
}

/**
 * Retrieve the active roadmap for a student with all phases & tasks
 */
export async function getActiveRoadmapForUser(
  userId: string,
  roadmapId?: string
): Promise<StudentRoadmap | null> {
  const client = getDbClient();

  try {
    await client.connect();

    let roadmapQuery = `
      SELECT id, user_id, role, target_company, timeline_weeks, status, generated_at, based_on_cache_id
      FROM roadmaps
      WHERE user_id = $1
    `;
    const params: (string | number)[] = [userId];

    if (roadmapId) {
      roadmapQuery += ' AND id = $2';
      params.push(roadmapId);
    } else {
      roadmapQuery += ' AND status = \'active\' ORDER BY generated_at DESC LIMIT 1';
    }

    const rmRes = await client.query(roadmapQuery, params);
    if (rmRes.rows.length === 0) {
      await client.end();
      return null;
    }

    const rmRow = rmRes.rows[0];
    const rId = rmRow.id;

    // Fetch phases
    const phaseRes = await client.query(
      `
      SELECT id, roadmap_id, order_index, title, summary
      FROM roadmap_phases
      WHERE roadmap_id = $1
      ORDER BY order_index ASC
      `,
      [rId]
    );

    // Fetch all tasks for this roadmap
    const taskRes = await client.query(
      `
      SELECT id, phase_id, roadmap_id, user_id, title, description,
             est_hours, priority, linked_skill, resource_url, source_type,
             status, due_week, completed_at
      FROM roadmap_tasks
      WHERE roadmap_id = $1
      ORDER BY due_week ASC, est_hours ASC
      `,
      [rId]
    );

    // Fetch cited sources if based_on_cache_id is present
    let sources: RoadmapSourceItem[] = [];
    if (rmRow.based_on_cache_id) {
      const srcRes = await client.query(
        `
        SELECT id, url, title, fetched_at
        FROM roadmap_sources
        WHERE role_cache_id = $1
        ORDER BY fetched_at ASC
        `,
        [rmRow.based_on_cache_id]
      );
      sources = srcRes.rows.map((s: { id: string; url: string; title: string; fetched_at: Date | string }) => ({
        id: s.id,
        url: s.url,
        title: s.title,
        fetchedAt: s.fetched_at instanceof Date ? s.fetched_at.toISOString() : String(s.fetched_at),
      }));
    }

    await client.end();

    const tasksByPhase = new Map<string, RoadmapTask[]>();
    let totalTasks = 0;
    let completedTasks = 0;

    taskRes.rows.forEach((t: { id: string; phase_id: string; roadmap_id: string; user_id: string; title: string; description: string; est_hours: string | number; priority: RoadmapTask['priority']; linked_skill: string; resource_url: string; source_type: RoadmapTask['sourceType']; status: RoadmapTask['status']; due_week: number; completed_at: Date | null }) => {
      totalTasks++;
      if (t.status === 'done') completedTasks++;

      const taskItem: RoadmapTask = {
        id: t.id,
        phaseId: t.phase_id,
        roadmapId: t.roadmap_id,
        userId: t.user_id,
        title: t.title,
        description: t.description,
        estHours: typeof t.est_hours === 'number' ? t.est_hours : parseFloat(t.est_hours) || 4.0,
        priority: t.priority,
        linkedSkill: t.linked_skill,
        resourceUrl: t.resource_url,
        sourceType: t.source_type,
        status: t.status,
        dueWeek: t.due_week,
        completedAt: t.completed_at ? t.completed_at.toISOString() : null,
      };

      const existing = tasksByPhase.get(t.phase_id) || [];
      existing.push(taskItem);
      tasksByPhase.set(t.phase_id, existing);
    });

    const phases: RoadmapPhase[] = phaseRes.rows.map((p: { id: string; roadmap_id: string; order_index: number; title: string; summary: string }) => ({
      id: p.id,
      roadmapId: p.roadmap_id,
      orderIndex: p.order_index,
      title: p.title,
      summary: p.summary,
      tasks: tasksByPhase.get(p.id) || [],
    }));

    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: rmRow.id,
      userId: rmRow.user_id,
      role: rmRow.role,
      targetCompany: rmRow.target_company,
      timelineWeeks: rmRow.timeline_weeks,
      status: rmRow.status,
      generatedAt: rmRow.generated_at?.toISOString?.() || String(rmRow.generated_at),
      basedOnCacheId: rmRow.based_on_cache_id,
      phases,
      sources,
      progressPercent,
    };
  } catch (err) {
    console.error('Error getting student roadmap:', err);
    try {
      await client.end();
    } catch {}
    return null;
  }
}

/**
 * Save complete new generated roadmap with phases & tasks
 */
export async function saveNewStudentRoadmap({
  userId,
  role,
  targetCompany,
  timelineWeeks,
  basedOnCacheId,
  phases,
}: {
  userId: string;
  role: string;
  targetCompany?: string | null;
  timelineWeeks: number;
  basedOnCacheId?: string | null;
  phases: Array<{
    title: string;
    summary: string;
    orderIndex: number;
    tasks: Array<{
      title: string;
      description: string;
      estHours: number;
      priority: string;
      linkedSkill: string;
      resourceUrl?: string;
      sourceType: string;
      dueWeek: number;
    }>;
  }>;
}): Promise<string> {
  const client = getDbClient();

  try {
    await client.connect();

    // 1. Archive previous active roadmaps for this user
    await client.query(
      `
      UPDATE roadmaps
      SET status = 'archived'
      WHERE user_id = $1 AND status = 'active'
      `,
      [userId]
    );

    // 2. Insert new roadmap
    const rmRes = await client.query(
      `
      INSERT INTO roadmaps (
        user_id, role, target_company, timeline_weeks, status, generated_at, based_on_cache_id
      ) VALUES ($1, $2, $3, $4, 'active', NOW(), $5)
      RETURNING id
      `,
      [userId, role, targetCompany || null, timelineWeeks, basedOnCacheId || null]
    );

    const roadmapId = rmRes.rows[0].id;

    // 3. Insert phases & tasks
    for (const phase of phases) {
      const phaseRes = await client.query(
        `
        INSERT INTO roadmap_phases (roadmap_id, order_index, title, summary)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        `,
        [roadmapId, phase.orderIndex, phase.title, phase.summary]
      );

      const phaseId = phaseRes.rows[0].id;

      for (const t of phase.tasks) {
        await client.query(
          `
          INSERT INTO roadmap_tasks (
            phase_id, roadmap_id, user_id, title, description,
            est_hours, priority, linked_skill, resource_url, source_type,
            status, due_week
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'todo', $11)
          `,
          [
            phaseId,
            roadmapId,
            userId,
            t.title,
            t.description,
            t.estHours || 4.0,
            t.priority || 'medium',
            t.linkedSkill || 'General',
            t.resourceUrl || null,
            t.sourceType || 'from sources',
            t.dueWeek || 1,
          ]
        );
      }
    }

    await client.end();
    return roadmapId;
  } catch (err) {
    console.error('Error saving new student roadmap:', err);
    try {
      await client.end();
    } catch {}
    throw err;
  }
}

/**
 * Update task status (todo -> in_progress -> done)
 */
export async function updateRoadmapTaskStatus(
  taskId: string,
  userId: string,
  status: TaskStatus
): Promise<{ success: boolean; progressPercent?: number }> {
  const client = getDbClient();

  try {
    await client.connect();

    const isDone = status === 'done';
    const res = await client.query(
      `
      UPDATE roadmap_tasks
      SET status = $1,
          completed_at = ${isDone ? 'NOW()' : 'NULL'}
      WHERE id = $2 AND user_id = $3
      RETURNING roadmap_id
      `,
      [status, taskId, userId]
    );

    if (res.rows.length === 0) {
      await client.end();
      return { success: false };
    }

    const roadmapId = res.rows[0].roadmap_id;

    // Calculate updated progress
    const countRes = await client.query(
      `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'done' THEN 1 END) as completed
      FROM roadmap_tasks
      WHERE roadmap_id = $1
      `,
      [roadmapId]
    );

    const total = parseInt(countRes.rows[0].total, 10) || 0;
    const completed = parseInt(countRes.rows[0].completed, 10) || 0;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Safely update user_progress questions_solved / streak if completed
    if (isDone) {
      try {
        await client.query(
          `
          INSERT INTO user_progress (user_id, questions_solved, updated_at)
          VALUES ($1, 1, NOW())
          ON CONFLICT (user_id) DO UPDATE
          SET questions_solved = user_progress.questions_solved + 1,
              updated_at = NOW()
          `,
          [userId]
        );
      } catch (progErr) {
        console.warn('user_progress sync notice:', progErr);
      }
    }

    await client.end();
    return { success: true, progressPercent };
  } catch (err) {
    console.error('Error updating task status:', err);
    try {
      await client.end();
    } catch {}
    return { success: false };
  }
}
