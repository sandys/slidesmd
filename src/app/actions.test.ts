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
import { redirect } from "next/navigation";
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

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("Server Actions", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe("createPresentation", () => {
    it("should create a new presentation and redirect", async () => {
      // Arrange
      const mockPublicId = "test-id";
      const mockEditKey = "test-edit-key";
      const mockHashedKey = "hashed-key";
      const mockPresentationId = 123;

      vi.mocked(nanoid).mockReturnValueOnce(mockPublicId).mockReturnValueOnce(mockEditKey);
      vi.mocked(bcrypt.hash).mockResolvedValue(mockHashedKey);
      
      const mockTx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ lastInsertRowid: mockPresentationId }),
        rollback: vi.fn(),
      };
      vi.mocked(db.transaction).mockImplementation(async (callback) => callback(mockTx as any));

      // Act
      await createPresentation();

      // Assert
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
        content: "# Welcome to your presentation!",
        order: 1,
      });
      expect(redirect).toHaveBeenCalledWith(`/p/${mockPublicId}?editKey=${mockEditKey}`);
    });
  });

  describe("getPresentation", () => {
    it("should return a presentation with slides", async () => {
      // Arrange
      const mockPublicId = "test-id";
      const mockPresentation = { id: 1, publicId: mockPublicId, slides: [] };
      vi.mocked(db.query.presentations.findFirst).mockResolvedValue(mockPresentation);

      // Act
      const result = await getPresentation(mockPublicId);

      // Assert
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
      // Arrange
      const mockPublicId = "test-id";
      const mockEditKey = "test-edit-key";
      const mockPresentation = { id: 1, publicId: mockPublicId, hashedEditKey: "hashed-key" };
      vi.mocked(db.query.presentations.findFirst).mockResolvedValue(mockPresentation);
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      // Act
      const isValid = await verifyEditKey(mockPublicId, mockEditKey);

      // Assert
      expect(isValid).toBe(true);
    });

    it("should return false for an invalid key", async () => {
        // Arrange
        const mockPublicId = "test-id";
        const mockEditKey = "wrong-key";
        const mockPresentation = { id: 1, publicId: mockPublicId, hashedEditKey: "hashed-key" };
        vi.mocked(db.query.presentations.findFirst).mockResolvedValue(mockPresentation);
        vi.mocked(bcrypt.compare).mockResolvedValue(false);
  
        // Act
        const isValid = await verifyEditKey(mockPublicId, mockEditKey);
  
        // Assert
        expect(isValid).toBe(false);
      });

      it("should return false if presentation not found", async () => {
        // Arrange
        vi.mocked(db.query.presentations.findFirst).mockResolvedValue(undefined);
  
        // Act
        const isValid = await verifyEditKey("not-found-id", "any-key");
  
        // Assert
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

    it("should throw an error if presentation is not found", async () => {
      vi.mocked(db.query.presentations.findFirst).mockResolvedValue(undefined);
      await expect(updatePresentation("not-found", "any-key", [])).rejects.toThrow("Presentation not found");
    });

    it("should throw an error for an invalid edit key", async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false);
      await expect(updatePresentation(mockPublicId, "wrong-key", [])).rejects.toThrow("Invalid edit key");
    });

    it("should insert a new slide", async () => {
      const newSlides = [{ content: "New Slide", order: 1 }];
      await updatePresentation(mockPublicId, mockEditKey, newSlides as any);
      expect(mockTx.insert).toHaveBeenCalledWith(slides);
      expect(mockTx.values).toHaveBeenCalledWith(expect.objectContaining({ content: "New Slide" }));
    });

    it("should update an existing slide", async () => {
      const newSlides = [{ id: 1, content: "Updated Content", order: 1 }];
      await updatePresentation(mockPublicId, mockEditKey, newSlides as any);
      expect(mockTx.update).toHaveBeenCalledWith(slides);
      expect(mockTx.set).toHaveBeenCalledWith({ content: "Updated Content", order: 1 });
      expect(mockTx.where).toHaveBeenCalledWith(expect.anything());
    });

    it("should delete a slide that is no longer present", async () => {
        const newSlides = [{ id: 2, content: "Only this slide should remain", order: 1 }];
        await updatePresentation(mockPublicId, mockEditKey, newSlides as any);
        expect(mockTx.delete).toHaveBeenCalledWith(slides);
        expect(mockTx.where).toHaveBeenCalledWith(expect.anything());
      });
  });
});
