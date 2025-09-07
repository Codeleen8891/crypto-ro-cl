import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatPopup from "@/components/ChatPopup";
import { chatApi, userApi } from "@/lib/api";

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

// --- Mock APIs ---
jest.mock("@/lib/api", () => ({
  chatApi: {
    sendMessage: jest.fn(),
    upload: jest.fn(),
    getConversation: jest.fn().mockResolvedValue([]),
  },
  userApi: {
    me: jest.fn().mockResolvedValue({ _id: "123", name: "User" }), // ✅ fix
  },
  adminApi: {
    usersList: jest.fn().mockResolvedValue([]), // ✅ add
  },
}));

describe("ChatPopup Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("token", "fake-jwt"); // ✅ simulate logged-in user
  });

  afterEach(() => {
    localStorage.clear();
  });
  it("renders and sends a text message", async () => {
    (chatApi.sendMessage as jest.Mock).mockResolvedValue({
      _id: "1",
      sender: "123",
      receiver: "admin",
      message: "Hello",
      type: "text",
      createdAt: new Date().toISOString(),
    });

    render(<ChatPopup />);

    // 🔑 open the chat popup first
    const toggleBtn = screen.getByTitle("Chat"); // ✅ update component accordingly

    await userEvent.click(toggleBtn);

    // now input should exist
    const input = await screen.findByPlaceholderText(/type a message/i);
    await userEvent.type(input, "Hello");

    const sendBtn = screen.getByRole("button", { name: /send/i });
    await userEvent.click(sendBtn);

    await waitFor(() => expect(chatApi.sendMessage).toHaveBeenCalled());
    expect(await screen.findByText("Hello")).toBeInTheDocument();
  });

  it("uploads a file", async () => {
    (chatApi.upload as jest.Mock).mockResolvedValue({
      fileUrl: "/uploads/chat/test.png",
    });

    (chatApi.sendMessage as jest.Mock).mockResolvedValue({
      _id: "2",
      sender: "123",
      receiver: "admin",
      message: "",
      fileUrl: "/uploads/chat/test.png",
      type: "image",
      createdAt: new Date().toISOString(),
    });

    render(<ChatPopup />);

    // 🔑 open chat popup
    const attachBtn = screen.getByRole("button", { name: /attach/i });
    await userEvent.click(attachBtn);

    const fileInput = await screen.findByTestId("chat-file-input");

    const file = new File(["dummy"], "test.png", { type: "image/png" });

    await userEvent.upload(fileInput, file);

    expect(chatApi.upload).toHaveBeenCalled();
    expect(await screen.findByAltText("uploaded-file")).toBeInTheDocument();
  });
});
