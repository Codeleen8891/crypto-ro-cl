import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UsersPage from "../app/dashboard/page";
import { adminApi } from "@/lib/api";

// --- Fix: lazy router mock ---
let mockPush: jest.Mock;
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// --- Mock API ---
jest.mock("@/lib/api", () => ({
  adminApi: {
    usersList: jest.fn(),
  },
}));

describe("Users Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush = jest.fn();
  });

  it("renders users from API", async () => {
    (adminApi.usersList as jest.Mock).mockResolvedValue([
      { _id: "1", name: "Alice", email: "alice@test.com", unread: 2 },
      { _id: "2", name: "Bob", email: "bob@test.com", unread: 0 },
    ]);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText(/alice/i)).toBeInTheDocument();
      expect(screen.getByText(/bob/i)).toBeInTheDocument();
    });

    // ✅ unread badge
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("filters users with search", async () => {
    (adminApi.usersList as jest.Mock).mockResolvedValue([
      { _id: "1", name: "Alice", email: "alice@test.com", unread: 0 },
      { _id: "2", name: "Bob", email: "bob@test.com", unread: 0 },
    ]);

    render(<UsersPage />);

    const searchInput = await screen.findByPlaceholderText(/search users/i);
    await userEvent.type(searchInput, "Alice");

    await waitFor(() => {
      expect(screen.getByText(/alice/i)).toBeInTheDocument();
      expect(screen.queryByText(/bob/i)).not.toBeInTheDocument();
    });
  });

  it("shows empty state when no users match search", async () => {
    (adminApi.usersList as jest.Mock).mockResolvedValue([
      { _id: "1", name: "Charlie", email: "charlie@test.com", unread: 0 },
    ]);

    render(<UsersPage />);

    const searchInput = await screen.findByPlaceholderText(/search users/i);
    await userEvent.type(searchInput, "Alice");

    await waitFor(() => {
      expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    });
  });
});
