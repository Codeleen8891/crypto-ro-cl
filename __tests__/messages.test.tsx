import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserChatPage from "@/app/dashboard/chat/page";
import { userApi, chatApi } from "@/lib/api";

// --- Mock socket.io-client ---
jest.mock("socket.io-client", () => {
  const ioMock = jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
  }));
  return {
    __esModule: true,
    default: ioMock, // supports: import io from "socket.io-client"
    io: ioMock, // supports: import { io } from "socket.io-client"
  };
});

// --- Mock API ---
jest.mock("@/lib/api", () => ({
  userApi: {
    me: jest.fn(),
  },
  chatApi: {
    getConversation: jest.fn(),
    sendMessage: jest.fn(),
    upload: jest.fn(),
  },
}));

describe("UserChatPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("userId", "u1"); // ✅ matches api.ts getIds()
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("loads profile and conversation", async () => {
    (userApi.me as jest.Mock).mockResolvedValue({
      _id: "u1",
      name: "Test User",
      email: "user@test.com",
    });

    (chatApi.getConversation as jest.Mock).mockResolvedValue([
      {
        _id: "m1",
        sender: "u1",
        receiver: "admin",
        message: "Hello Admin",
        type: "text",
        createdAt: new Date().toISOString(),
      },
      {
        _id: "m2",
        sender: "admin",
        receiver: "u1",
        message: "Hi User",
        type: "text",
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<UserChatPage />);

    expect(await screen.findByText(/hello admin/i)).toBeInTheDocument();
    expect(await screen.findByText(/hi user/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/signed in as test user/i)
    ).toBeInTheDocument();
  });

  it("sends a text message", async () => {
    (userApi.me as jest.Mock).mockResolvedValue({
      _id: "u1",
      name: "Test User",
      email: "user@test.com",
    });
    (chatApi.getConversation as jest.Mock).mockResolvedValue([]);
    (chatApi.sendMessage as jest.Mock).mockResolvedValue({
      _id: "m3",
      sender: "u1",
      receiver: "admin",
      message: "Hello there",
      type: "text",
      createdAt: new Date().toISOString(),
    });

    render(<UserChatPage />);

    const input = await screen.findByPlaceholderText(/type a message/i);
    await userEvent.type(input, "Hello there");

    const sendBtn = screen.getByRole("button", { name: /send/i });
    await userEvent.click(sendBtn);

    await waitFor(() => expect(chatApi.sendMessage).toHaveBeenCalled());
    expect(await screen.findByText("Hello there")).toBeInTheDocument();
  });

  it("uploads a file and sends message", async () => {
    (userApi.me as jest.Mock).mockResolvedValue({
      _id: "u1",
      name: "Test User",
      email: "user@test.com",
    });
    (chatApi.getConversation as jest.Mock).mockResolvedValue([]);
    (chatApi.upload as jest.Mock).mockResolvedValue({
      fileUrl: "/uploads/chat/test.png",
    });
    (chatApi.sendMessage as jest.Mock).mockResolvedValue({
      _id: "m4",
      sender: "u1",
      receiver: "admin",
      message: "",
      fileUrl: "/uploads/chat/test.png",
      type: "image",
      createdAt: new Date().toISOString(),
    });

    render(<UserChatPage />);

    const fileInput = screen.getByTestId("chat-file-input") as HTMLInputElement;
    const file = new File(["dummy"], "test.png", { type: "image/png" });

    await userEvent.upload(fileInput, file);

    expect(chatApi.upload).toHaveBeenCalled();
    expect(await screen.findByAltText("uploaded-file")).toBeInTheDocument();
  });
});
