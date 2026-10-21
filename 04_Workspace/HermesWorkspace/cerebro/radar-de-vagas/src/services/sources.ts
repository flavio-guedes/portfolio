import type { JobOpportunity } from '../types/opportunity';
import type { NetworkContact, JobRelationship } from '../types/network';

export interface JobSource {
  name: string;
  fetchOpportunities(): Promise<JobOpportunity[]>;
}

export interface NetworkSource {
  name: string;
  fetchContacts(): Promise<NetworkContact[]>;
  relateToJobs(contacts: NetworkContact[], jobs: JobOpportunity[]): Promise<JobRelationship[]>;
}

export class LinkedInJobsSource implements JobSource {
  name = 'linkedin_jobs';
  async fetchOpportunities(): Promise<JobOpportunity[]> {
    return [];
  }
}

export class LinkedInPostsSource implements JobSource {
  name = 'linkedin_posts';
  async fetchOpportunities(): Promise<JobOpportunity[]> {
    return [];
  }
}

export class LinkedInNetworkSource implements NetworkSource {
  name = 'linkedin_network';
  async fetchContacts(): Promise<NetworkContact[]> {
    return [];
  }
  async relateToJobs(_contacts: NetworkContact[], _jobs: JobOpportunity[]): Promise<JobRelationship[]> {
    return [];
  }
}

export class ManualSource implements JobSource {
  name = 'manual';
  async fetchOpportunities(): Promise<JobOpportunity[]> {
    return [];
  }
}

export class BrowserSource implements JobSource {
  name = 'browser';
  async fetchOpportunities(): Promise<JobOpportunity[]> {
    return [];
  }
}
