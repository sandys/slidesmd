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
      
      const mockTx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ lastInsertRowid: mockPresentationId }),
        rollback: vi.fn(),
      };
      vi.mocked(db.transaction).mockImplementation(async (callback) => callback(mockTx as any));

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
    it("should return a presentation with slides", async () => {
      const mockPublicId = "test-id";
      const mockPresentation = { id: 1, publicId: mockPublicId, slides: [] };
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
    const mockPresentation = { id: 1, publicId: mockPublicId, hashedEditKey: "hashed-key" };

    const mockTx = {
      delete: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };

    beforeEach(() => {
      vi.mocked(db.query.presentations.findFirst).mockResolvedValue(mockPresentation);
      vi.mocked(bcrypt.compare).mockResolvedValue(true);
      vi.mocked(db.transaction).mockImplementation(async (callback) => callback(mockTx as any));
    });

    it("should update an existing slide with content", async () => {
      const newSlides = [{ id: 1, content: "new-data", order: 1 }];
      await updatePresentation(mockPublicId, mockEditKey, newSlides as any);
      expect(mockTx.update).toHaveBeenCalledWith(slides);
      expect(mockTx.set).toHaveBeenCalledWith({ content: "new-data", order: 1 });
    });
  });
});
