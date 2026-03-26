import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  addDoc, 
  orderBy, 
  limit, 
  getCountFromServer,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { RawBusiness, VerifiedBusiness, AgentTask } from '../types';

const DEFAULT_PAGE_SIZE = 25;

const normalizeFilterValue = (value?: string) => {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized.startsWith('all')) return undefined;
  return value;
};

const buildBusinessQuery = (filters: any) => {
  let q = query(collection(db, 'businesses'), orderBy('created_at', 'desc'));

  const status = normalizeFilterValue(filters.status)?.toLowerCase();
  const city = normalizeFilterValue(filters.city);
  const category = normalizeFilterValue(filters.category);
  const minScore = Number(filters.minScore || 0);

  if (status) {
    q = query(q, where('status', '==', status));
  }
  if (city) {
    q = query(q, where('city', '==', city));
  }
  if (category) {
    q = query(q, where('category', '==', category));
  }
  if (minScore > 0) {
    q = query(q, where('confidence_score', '>=', minScore));
  }

  return q;
};

export const businessService = {
  async getStats() {
    const [
      rawCount,
      verifiedCount,
      pendingCount,
      approvedCount,
      taskCount
    ] = await Promise.all([
      getCountFromServer(collection(db, 'raw_businesses')),
      getCountFromServer(collection(db, 'businesses')),
      getCountFromServer(query(collection(db, 'businesses'), where('status', '==', 'pending'))),
      getCountFromServer(query(collection(db, 'businesses'), where('status', '==', 'approved'))),
      getCountFromServer(collection(db, 'agent_tasks'))
    ]);

    return {
      rawCount: rawCount.data().count || 0,
      verifiedCount: verifiedCount.data().count || 0,
      pendingCount: pendingCount.data().count || 0,
      approvedCount: approvedCount.data().count || 0,
      taskCount: taskCount.data().count || 0
    };
  },

  async getVerifiedBusinesses(filters: any, options?: { page?: number; pageSize?: number }) {
    const q = buildBusinessQuery(filters);
    const [snapshot, countSnapshot] = await Promise.all([
      getDocs(q),
      getCountFromServer(q)
    ]);

    const allRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VerifiedBusiness[];
    const searchTerm = (filters.search || '').toString().trim().toLowerCase();
    const filteredRecords = searchTerm
      ? allRecords.filter((business) =>
          [business.name_ar, business.name_en, business.name_ku, business.phone]
            .filter(Boolean)
            .some((value) => value!.toString().toLowerCase().includes(searchTerm))
        )
      : allRecords;

    const page = Math.max(1, options?.page || 1);
    const pageSize = Math.max(1, options?.pageSize || DEFAULT_PAGE_SIZE);
    const startIndex = (page - 1) * pageSize;
    const data = filteredRecords.slice(startIndex, startIndex + pageSize);

    return {
      data,
      total: filteredRecords.length,
      totalFromFilteredQuery: countSnapshot.data().count || 0,
      page,
      pageSize
    };
  },

  async updateStatus(id: string, status: string) {
    const businessRef = doc(db, 'businesses', id);
    await updateDoc(businessRef, { 
      status, 
      approved_at: status === 'approved' ? new Date().toISOString() : null 
    });
  },

  async batchApprove(ids: string[]) {
    const batch = writeBatch(db);
    ids.forEach(id => {
      const businessRef = doc(db, 'businesses', id);
      batch.update(businessRef, { 
        status: 'approved', 
        approved_at: new Date().toISOString() 
      });
    });
    await batch.commit();
  }
};

export const cleaningService = {
  repairText(text: string): string {
    if (!text) return '';
    try {
      return decodeURIComponent(escape(text));
    } catch (e) {
      return text;
    }
  },

  calculateScores(business: Partial<VerifiedBusiness>) {
    let vScore = 0;
    let cScore = 0;

    const hasName = !!(business.name_ar || business.name_ku || business.name_en);
    const hasLocation = !!(business.city);
    const hasPhone = !!business.phone;

    if (hasName) vScore = 1;
    if (hasName && hasLocation) vScore = 2;
    if (hasName && hasLocation && hasPhone) vScore = 3;

    if (hasName) cScore += 40;
    if (hasLocation) cScore += 30;
    if (hasPhone) cScore += 30;

    return { vScore, cScore };
  },

  async pushToRaw(records: any[]) {
    const batch = writeBatch(db);
    records.forEach(record => {
      const newDocRef = doc(collection(db, 'raw_businesses'));
      batch.set(newDocRef, record);
    });
    await batch.commit();
  }
};

export const taskService = {
  async getTasks() {
    const q = query(collection(db, 'agent_tasks'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AgentTask[];
  },

  async createTask(task: Partial<AgentTask>) {
    await addDoc(collection(db, 'agent_tasks'), {
      ...task,
      created_at: new Date().toISOString()
    });
  },

  async getLogs(taskId: string) {
    const q = query(
      collection(db, 'agent_logs'), 
      where('record_id', '==', taskId),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};
