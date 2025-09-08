import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminChatPage from "@/app/admin/page";
import { adminApi, chatApi } from "@/lib/api";

// --- Router mock ---
let mockReplace: jest.Mock;

jest.mock("next/navigation", () => {
  mockReplace = jest.fn();
  return {
    useRouter: () => ({
      push: jest.fn(),
      replace: mockReplace,
      prefetch: jest.fn(),
    }),
  };
});

// --- Language context mock ---
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ lang: "en", setLang: jest.fn() }),
}));

// --- API mocks ---
jest.mock("@/lib/api", () => ({
  adminApi: { usersList: jest.fn() },
  chatApi: {
    getConversation: jest.fn(),
    sendMessage: jest.fn(),
    upload: jest.fn(),
  },
}));

// --- Socket mock ---
jest.mock("socket.io-client", () => {
  return jest.fn(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  }));
});

describe("AdminChatPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("adminId", "admin1");
    localStorage.setItem("token", "fake-token");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("loads users in sidebar", async () => {
    (adminApi.usersList as jest.Mock).mockResolvedValue([
      { _id: "u1", name: "Alice", email: "a@test.com", photo: "" },
      { _id: "u2", name: "Bob", email: "b@test.com", photo: "" },
    ]);

    render(<AdminChatPage />);

    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(await screen.findByText("Bob")).toBeInTheDocument();
  });

  it("loads and shows conversation when selecting a user", async () => {
    (adminApi.usersList as jest.Mock).mockResolvedValue([
      { _id: "u1", name: "Alice", email: "a@test.com", photo: "" },
    ]);

    (chatApi.getConversation as jest.Mock).mockResolvedValue([
      {
        _id: "m1",
        sender: "u1",
        receiver: "admin1",
        message: "Hello Admin",
        type: "text",
      },
      {
        _id: "m2",
        sender: "admin1",
        receiver: "u1",
        message: "Hi Alice",
        type: "text",
      },
    ]);

    render(<AdminChatPage />);

    const userItem = await screen.findByText("Alice");
    await userEvent.click(userItem);

    await waitFor(() => {
      expect(screen.getByText("Hello Admin")).toBeInTheDocument();
      expect(screen.getByText("Hi Alice")).toBeInTheDocument();
    });
  });

  it("sends a text message", async () => {
    (adminApi.usersList as jest.Mock).mockResolvedValue([
      { _id: "u1", name: "Alice", email: "a@test.com", photo: "" },
    ]);
    (chatApi.getConversation as jest.Mock).mockResolvedValue([]);

    (chatApi.sendMessage as jest.Mock).mockImplementation(({ to, message }) =>
      Promise.resolve({
        _id: "m3",
        sender: "admin1",
        receiver: to,
        message,
        type: "text",
      })
    );

    render(<AdminChatPage />);

    const userItem = await screen.findByText("Alice");
    await userEvent.click(userItem);

    const input = await screen.findByPlaceholderText(/type a message/i);
    await userEvent.type(input, "Reply Alice");

    const sendBtn = screen.getByRole("button", { name: /send/i });
    await userEvent.click(sendBtn);

    await waitFor(() =>
      expect(chatApi.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "u1",
          message: "Reply Alice",
        }),
        expect.any(Object)
      )
    );

    expect(await screen.findByText("Reply Alice")).toBeInTheDocument();
  });

  it("uploads a file and sends", async () => {
    (adminApi.usersList as jest.Mock).mockResolvedValue([
      { _id: "u1", name: "Alice", email: "a@test.com", photo: "" },
    ]);
    (chatApi.getConversation as jest.Mock).mockResolvedValue([]);

    (chatApi.upload as jest.Mock).mockResolvedValue({
      fileUrl: "/uploads/chat/file.png",
    });

    (chatApi.sendMessage as jest.Mock).mockImplementation(({ to, fileUrl }) =>
      Promise.resolve({
        _id: "m4",
        sender: "admin1",
        receiver: to,
        message: "",
        fileUrl,
        type: "image",
      })
    );

    render(<AdminChatPage />);

    const userItem = await screen.findByText("Alice");
    await userEvent.click(userItem);

    const fileInput = screen.getByTestId("chat-file-input") as HTMLInputElement;
    const file = new File(["dummy"], "file.png", { type: "image/png" });

    await userEvent.upload(fileInput, file);

    expect(chatApi.upload).toHaveBeenCalled();
    expect(await screen.findByAltText("uploaded-file")).toBeInTheDocument();
  });

  it("logs out and clears localStorage", async () => {
    (adminApi.usersList as jest.Mock).mockResolvedValue([]);

    render(<AdminChatPage />);

    const logoutBtn = screen.getByTitle("Logout");
    await userEvent.click(logoutBtn);

    expect(localStorage.getItem("token")).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });
});
