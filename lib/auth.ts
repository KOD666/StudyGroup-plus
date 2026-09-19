import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, DatabaseInstance } from "./db";
import { users, User } from "@/models";

export interface AuthContext {
  userId: string; // Internal User UUID in Postgres
  clerkId: string;
  user: User;
}

export type AuthResult =
  | { success: true; context: AuthContext }
  | { success: false; response: NextResponse };

/**
 * Ensures the caller is authenticated via Clerk and resolves/syncs the internal User record.
 * Returns 401 when unauthenticated before any business logic or DB operation.
 */
export async function requireAuth(
  database?: DatabaseInstance
): Promise<AuthResult> {
  let clerkId: string | null = null;
  try {
    const authState = await auth();
    clerkId = authState.userId;
  } catch {
    clerkId = null;
  }

  if (!clerkId) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Unauthorized: Missing or invalid authentication session" },
        { status: 401 }
      ),
    };
  }

  const d = database ?? db;

  let user: User | undefined;
  try {
    const rows = await d
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);
    user = rows[0];
  } catch (dbErr: unknown) {
    if (
      dbErr &&
      typeof dbErr === "object" &&
      "code" in dbErr &&
      dbErr.code === "42P01"
    ) {
      console.error(
        "\n❌ FATAL DATABASE ERROR: relation 'users' does not exist in the connected database!\n" +
          "   Please run `npm run db:migrate` to apply pending Drizzle schema migrations.\n"
      );
      return {
        success: false,
        response: NextResponse.json(
          {
            error:
              "Database Configuration Error: Database tables have not been created. Run `npm run db:migrate` to apply migrations.",
          },
          { status: 500 }
        ),
      };
    }
    throw dbErr;
  }

  // 2. If not found, sync user details from Clerk
  if (!user) {
    try {
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return {
          success: false,
          response: NextResponse.json(
            { error: "Unauthorized: Unable to retrieve user profile" },
            { status: 401 }
          ),
        };
      }

      const primaryEmail =
        clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress ??
        clerkUser.emailAddresses[0]?.emailAddress ??
        `${clerkId}@placeholder.local`;

      const fullName =
        clerkUser.fullName ??
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ??
        primaryEmail.split("@")[0] ??
        "User";

      const [newUser] = await d
        .insert(users)
        .values({
          clerkId,
          email: primaryEmail,
          name: fullName,
          avatarUrl: clerkUser.imageUrl ?? null,
        })
        .returning();

      user = newUser;
    } catch {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Internal Server Error: Failed to synchronize user profile",
          },
          { status: 500 }
        ),
      };
    }
  }

  if (!user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Unauthorized: User not found" },
        { status: 401 }
      ),
    };
  }

  return {
    success: true,
    context: {
      userId: user.id,
      clerkId,
      user,
    },
  };
}
