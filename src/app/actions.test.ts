// src/app/actions.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createPresentation,
  getPresentation,
  updatePresentation,
  verifyEditKey,
} from "./actions";
import { db } from "@/db";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";
import { presentations, slides } from "@/db/schema";
import type { LibSQLTransaction } from "drizzle-orm/libsql";

// Mock dependencies
vi.mock("@/db", () => ({
  db: {
    transaction: vi.fn(),
    query: {
      presentations: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock("nanoid", () => ({
  nanoid: vi.fn(),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Define a type for the mock transaction
type MockTx = Omit<LibSQLTransaction<any, any, any, any>, "run" | "all" | "get" | "values"> & {
    run: ReturnType<typeof vi.fn>;
    all: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    values: ReturnType<typeof vi.fn>;
};

describe("Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPresentation", () => {
    it("should create a new presentation and return publicId and editKey", async () => {
      const mockPublicId = "test-id";
      const mockEditKey = "test-edit-key";
      const mockHashedKey = "hashed-key";
      const mockPresentationId = 123;
      const mockEncryptedContent = "encrypted-data";

      vi.mocked(nanoid).mockReturnValueOnce(mockPublicId).mockReturnValueOnce(mockEditKey);
      vi.mocked(bcrypt.hash).mockResolvedValue(mockHashedKey);
      
      const mockTx: MockTx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ lastInsertRowid: mockPresentationId }),
        rollback: vi.fn(),
        all: vi.fn(),
        get: vi.fn(),
        delete: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      };
      vi.mocked(db.transaction).mockImplementation(async (callback) => callback(mockTx));

      const result = await createPresentation(mockEncryptedContent);

      expect(nanoid).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith(mockEditKey, 10);
      expect(mockTx.insert).toHaveBeenCalledWith(presentations);
      expect(mockTx.values).toHaveBeenCalledWith({
        publicId: mockPublicId,
        hashedEditKey: mockHashedKey,
      });
      expect(mockTx.insert).toHaveBeenCalledWith(slides);
      expect(mockTx.values).toHaveBeenCalledWith({
        presentationId: mockPresentationId,
        content: mockEncryptedContent,
        order: 1,
      });
      expect(result).toEqual({ publicId: mockPublicId, editKey: mockEditKey });
    });
  });

  describe("getPresentation", () => {
    it("should return a presentation with slides and theme", async () => {
      const mockPublicId = "test-id";
      const mockPresentation = { id: 1, publicId: mockPublicId, slides: [], theme: "light" };
      vi.mocked(db.query.presentations.findFirst).mockResolvedValue(mockPresentation);

      const result = await getPresentation(mockPublicId);

      expect(db.query.presentations.findFirst).toHaveBeenCalledWith({
        where: expect.anything(),
        with: {
          slides: {
            orderBy: expect.anything(),
          },
        },
      });
      expect(result).toEqual(mockPresentation);
    });
  });

  describe("verifyEditKey", () => {
    it("should return true for a valid key", async () => {
      const mockPublicId = "test-id";
      const mockEditKey = "test-edit-key";
      const mockPresentation = { id: 1, publicId: mockPublicId, hashedEditKey: "hashed-key" };
      vi.mocked(db.query.presentations.findFirst).mockResolvedValue(mockPresentation);
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      const isValid = await verifyEditKey(mockPublicId, mockEditKey);

      expect(isValid).toBe(true);
    });

    it("should return false if presentation not found", async () => {
      vi.mocked(db.query.presentations.findFirst).mockResolvedValue(undefined);
      const isValid = await verifyEditKey("not-found-id", "any-key");
      expect(isValid).toBe(false);
    });
  });

  describe("updatePresentation", () => {
    const mockPublicId = "test-id";
    const mockEditKey = "test-edit-key";
    const mockPresentation = { id: 1, publicId: mockPublicId, hashedEditKey: "hashed-key", theme: "light" };

    const mockTx: MockTx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        run: vi.fn(),
        rollback: vi.fn(),
        all: vi.fn(),
        get: vi.fn(),
        delete: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      };

    beforeEach(() => {
      vi.mocked(db.query.presentations.findFirst).mockResolvedValue(mockPresentation);
      vi.mocked(bcrypt.compare).mockResolvedValue(true);
      vi.mocked(db.transaction).mockImplementation(async (callback) => callback(mockTx));
    });

    it("should throw an error if the presentation is not found", async () => {
      vi.mocked(db.query.presentations.findFirst).mockResolvedValue(undefined);
      const newSlides = [{ id: 1, content: "new-data", order: 1 }];
      await expect(updatePresentation(mockPublicId, mockEditKey, newSlides, "dark")).rejects.toThrow("Presentation not found");
    });

    it("should throw an error for an invalid edit key", async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false);
      const newSlides = [{ id: 1, content: "new-data", order: 1 }];
      await expect(updatePresentation(mockPublicId, mockEditKey, newSlides, "dark")).rejects.toThrow("Invalid edit key");
    });

    it("should update the presentation theme", async () => {
      const newSlides = [{ id: 1, content: "new-data", order: 1 }];
      await updatePresentation(mockPublicId, mockEditKey, newSlides, "dark");
      expect(mockTx.update).toHaveBeenCalledWith(presentations);
      expect(mockTx.set).toHaveBeenCalledWith({ theme: "dark" });
      expect(mockTx.where).toHaveBeenCalledWith(expect.anything());
    });

    it("should update an existing slide", async () => {
      const newSlides = [{ id: 1, content: "new-data", order: 1 }];
      await updatePresentation(mockPublicId, mockEditKey, newSlides, "light");
      expect(mockTx.update).toHaveBeenCalledWith(slides);
      expect(mockTx.set).toHaveBeenCalledWith({ content: "new-data", order: 1 });
      expect(mockTx.where).toHaveBeenCalledWith(expect.anything());
    });

    it("should add a new slide", async () => {
      const newSlides = [{ content: "new-slide-data", order: 1 }];
      await updatePresentation(mockPublicId, mockEditKey, newSlides, "light");
      expect(mockTx.insert).toHaveBeenCalledWith(slides);
      expect(mockTx.values).toHaveBeenCalledWith({
        presentationId: mockPresentation.id,
        content: "new-slide-data",
        order: 1,
      });
    });

    it("should delete a slide", async () => {
      const newSlides = [{ id: 1, content: "data", order: 1 }];
      // Simulate that the DB has slides with id 1 and 2
      await updatePresentation(mockPublicId, mockEditKey, newSlides, "light");
      expect(mockTx.delete).toHaveBeenCalledWith(slides);
      expect(mockTx.where).toHaveBeenCalledWith(expect.anything());
    });

    it("should reorder slides", async () => {
        const newSlides = [
            { id: 1, content: "slide 1", order: 2 },
            { id: 2, content: "slide 2", order: 1 },
        ];
        await updatePresentation(mockPublicId, mockEditKey, newSlides, "light");
        
        // Check first update call
        expect(mockTx.update).toHaveBeenCalledWith(slides);
        expect(mockTx.set).toHaveBeenCalledWith({ content: "slide 1", order: 2 });
        
        // Check second update call
        expect(mockTx.update).toHaveBeenCalledWith(slides);
        expect(mockTx.set).toHaveBeenCalledWith({ content: "slide 2", order: 1 });
    });
  });
});