export type Role = "REPORTER" | "ANALYST" | "ADMIN";

export type User = {
  userId: number;
  name: string;
  email: string;
  role: Role;
};

export type Report = {
  reportId: number;
  title: string;
  description: string;
  severity: string;
  status: string;
  reportedAt: string;
  reporterName: string;
  accountUsername: string;
  platformName: string;
  categoryName: string;
};

export type Catalogs = {
  accounts: {
    accountId: number;
    username: string;
    platformName: string;
  }[];
  categories: {
    categoryId: number;
    categoryName: string;
  }[];
  analysts: {
    analystId: number;
    name: string;
    department: string | null;
  }[];
};

export type Detail = {
  investigation?: {
    finding: string;
    remarks: string | null;
    analystName: string;
    investigatedAt: string;
  };
  evidence: {
    evidenceId: number;
    evidenceType: string;
    description: string | null;
    filePathOrUrl: string | null;
  }[];
};