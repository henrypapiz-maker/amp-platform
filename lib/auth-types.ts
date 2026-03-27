import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "admin" | "analyst" | "viewer";
      orgId: string;
    };
  }

  interface User {
    role?: string;
    orgId?: string;
  }
}
