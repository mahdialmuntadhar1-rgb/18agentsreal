export type PipelineJobStatus = 'PENDING' | 'RUNNING' | 'RETRYING' | 'COMPLETED' | 'FAILED';

export interface PipelineTask {
  id: string;
  name: 'normalize' | 'validate' | 'match' | 'merge' | 'aggregate' | 'report';
  status: PipelineJobStatus;
  attempts: number;
  error?: string;
}

export interface PipelineJob {
  id: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  status: PipelineJobStatus;
  maxRetries: number;
  tasks: PipelineTask[];
}

export class JobOrchestrator {
  private jobs = new Map<string, PipelineJob>();

  createJob(id: string, source: string, maxRetries = 2): PipelineJob {
    const now = new Date().toISOString();
    const tasks: PipelineTask['name'][] = ['normalize', 'validate', 'match', 'merge', 'aggregate', 'report'];
    const job: PipelineJob = {
      id,
      source,
      createdAt: now,
      updatedAt: now,
      status: 'PENDING',
      maxRetries,
      tasks: tasks.map((name, index) => ({ id: `${id}-task-${index + 1}`, name, status: 'PENDING', attempts: 0 })),
    };

    this.jobs.set(id, job);
    return job;
  }

  transitionTask(jobId: string, taskId: string, nextStatus: PipelineJobStatus, error?: string): PipelineJob | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    const task = job.tasks.find((item) => item.id === taskId);
    if (!task) return null;

    const attempts = nextStatus === 'RETRYING' || nextStatus === 'FAILED' ? task.attempts + 1 : task.attempts;
    task.status = nextStatus;
    task.attempts = attempts;
    task.error = error;

    if (nextStatus === 'FAILED' && attempts <= job.maxRetries) task.status = 'RETRYING';

    const allDone = job.tasks.every((item) => item.status === 'COMPLETED');
    const anyRetrying = job.tasks.some((item) => item.status === 'RETRYING');
    const hardFail = job.tasks.some((item) => item.status === 'FAILED' && item.attempts > job.maxRetries);

    if (allDone) job.status = 'COMPLETED';
    else if (hardFail) job.status = 'FAILED';
    else if (anyRetrying) job.status = 'RETRYING';
    else if (job.tasks.some((item) => item.status === 'RUNNING')) job.status = 'RUNNING';
    else job.status = 'PENDING';

    job.updatedAt = new Date().toISOString();
    return job;
  }

  listJobs(): PipelineJob[] {
    return [...this.jobs.values()];
  }
}
