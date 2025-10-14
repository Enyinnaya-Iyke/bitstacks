// "use server";
import { and, desc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "../auth/auth";
import { db } from "../db/drizzle";
import {
  story,
  storyInsertSchema,
  storySelectSchema,
} from "../db/schema/story";
import { authenticatedAction } from "./safe-action";

const isOrgOwner = async () => {
  return await auth.api.hasPermission({
    headers: await headers(),
    body: {
      permissions: {
        story: ["create", "update", "delete"],
      },
    },
  });
};

export const createStory = authenticatedAction
  .createServerAction()
  .input(
    storyInsertSchema.omit({
      id: true,
      createdAt: true,
      creatorId: true,
    }),
  )
  .handler(async ({ input, ctx }) => {
    const hasPermission = await isOrgOwner();

    if (!hasPermission) {
      throw new Error("You don't have permission to create stories");
    }

    const [newStory] = await db
      .insert(story)
      .values({
        ...input,
        creatorId: ctx.user.userId,
      })
      .returning();

    return { data: newStory, status: newStory.id ? "success" : "error" };
  });

// Get story by ID
export const getStoryById = authenticatedAction
  .createServerAction()
  .input(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .handler(async ({ input }) => {
    const foundStory = await db
      .select()
      .from(story)
      .where(eq(story.id, input.id))
      .limit(1);

    if (!foundStory.length) {
      throw new Error("Story not found");
    }

    return foundStory[0];
  });

// Get stories by organization
export const getStoriesByOrg = authenticatedAction
  .createServerAction()
  .input(
    z.object({
      orgId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }),
  )
  .handler(async ({ input }) => {
    const stories = await db
      .select()
      .from(story)
      .where(eq(story.orgId, input.orgId))
      .orderBy(desc(story.createdAt))
      .limit(input.limit)
      .offset(input.offset);

    return stories;
  });

// Get stories by creator
export const getStoriesByCreator = authenticatedAction
  .createServerAction()
  .input(
    z.object({
      creatorId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }),
  )
  .handler(async ({ input }) => {
    const stories = await db
      .select()
      .from(story)
      .where(eq(story.creatorId, input.creatorId))
      .orderBy(desc(story.createdAt))
      .limit(input.limit)
      .offset(input.offset);

    return stories;
  });

// Get current user's stories
export const getMyStories = authenticatedAction
  .createServerAction()
  .input(
    z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }),
  )
  .handler(async ({ input, ctx }) => {
    const stories = await db
      .select()
      .from(story)
      .where(eq(story.creatorId, ctx.user.userId))
      .orderBy(desc(story.createdAt))
      .limit(input.limit)
      .offset(input.offset);

    return stories;
  });

// Update story
export const updateStory = authenticatedAction
  .createServerAction()
  .input(
    z.object({
      id: z.string().uuid(),
      data: storyInsertSchema
        .omit({
          id: true,
          createdAt: true,
          creatorId: true,
          orgId: true, // Prevent changing organization
        })
        .partial(), // Make all fields optional for updates
    }),
  )
  .handler(async ({ input, ctx }) => {
    // First check if story exists and user owns it
    const existingStory = await db
      .select()
      .from(story)
      .where(
        and(
          eq(story.id, input.id),
          eq(story.creatorId, ctx.user.userId), // Only allow updates by creator
        ),
      )
      .limit(1);

    if (!existingStory.length) {
      throw new Error(
        "Story not found or you don't have permission to update it",
      );
    }

    const updatedStory = await db
      .update(story)
      .set(input.data)
      .where(eq(story.id, input.id))
      .returning();

    return updatedStory[0];
  });

// Delete story
export const deleteStory = authenticatedAction
  .createServerAction()
  .input(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .handler(async ({ input, ctx }) => {
    // First check if story exists and user owns it
    const existingStory = await db
      .select()
      .from(story)
      .where(
        and(
          eq(story.id, input.id),
          eq(story.creatorId, ctx.user.userId), // Only allow deletion by creator
        ),
      )
      .limit(1);

    if (!existingStory.length) {
      throw new Error(
        "Story not found or you don't have permission to delete it",
      );
    }

    await db.delete(story).where(eq(story.id, input.id));

    return { success: true };
  });

// Search stories by title/content
export const searchStories = authenticatedAction
  .createServerAction()
  .input(
    z.object({
      query: z.string().min(1).max(200),
      orgId: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }),
  )
  .handler(async ({ input }) => {
    let whereCondition;

    if (input.orgId) {
      whereCondition = and(
        eq(story.orgId, input.orgId),
        // Note: For production, you'd want to use proper full-text search
        // This is a simple ILIKE search for demonstration
      );
    }

    const stories = await db
      .select()
      .from(story)
      .where(whereCondition)
      .orderBy(desc(story.createdAt))
      .limit(input.limit)
      .offset(input.offset);

    // Filter by search query (in production, use database full-text search)
    const filteredStories = stories.filter(
      (s) =>
        s.title.toLowerCase().includes(input.query.toLowerCase()) ||
        s.content.toLowerCase().includes(input.query.toLowerCase()),
    );

    return filteredStories;
  });

// Get story count by organization
export const getStoryCount = authenticatedAction
  .createServerAction()
  .input(
    z.object({
      orgId: z.string().uuid(),
    }),
  )
  .handler(async ({ input }) => {
    const count = await db
      .select({ count: sql<number>`count(*)` })
      .from(story)
      .where(eq(story.orgId, input.orgId));

    return count[0]?.count || 0;
  });

// Bulk update XP for stories
export const bulkUpdateStoryXP = authenticatedAction
  .createServerAction()
  .input(
    z.object({
      updates: z.array(
        z.object({
          id: z.string().uuid(),
          xp: z.number().min(0),
        }),
      ),
    }),
  )
  .handler(async ({ input, ctx }) => {
    const results = [];

    for (const update of input.updates) {
      // Check ownership for each story
      const existingStory = await db
        .select()
        .from(story)
        .where(
          and(eq(story.id, update.id), eq(story.creatorId, ctx.user.userId)),
        )
        .limit(1);

      if (existingStory.length) {
        const updated = await db
          .update(story)
          .set({ xp: update.xp })
          .where(eq(story.id, update.id))
          .returning();

        results.push(updated[0]);
      }
    }

    return results;
  });
