import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserChatPage from "@/app/dashboard/chat/page";
import { userApi, chatApi } from "@/lib/api";

// --- Mock socket.io-client (if used internally) ---
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
  userApi: {
    me: jest.fn(),
  },
  chatApi: {
    getConversation: jest.fn(),
    sendMessage: jest.fn(),
    upload: jest.fn(),
  },
}));

// --- Mock VoiceRecorder (aligned with real component) ---
jest.mock("@/components/VoiceRecorder", () => ({
  __esModule: true,
  default: ({ onStop }: { onStop: (blob: Blob) => void }) => (
    <button
      onClick={() => onStop(new Blob(["test audio"], { type: "audio/wav" }))}
    >
      ● Voice
    </button>
  ),
}));

describe("UserChatPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (userApi.me as jest.Mock).mockResolvedValue({
      _id: "u1",
      name: "Test User",
    });
    (chatApi.getConversation as jest.Mock).mockResolvedValue([]);
  });

  it("sends a text message", async () => {
    (chatApi.sendMessage as jest.Mock).mockResolvedValue({
      _id: "m1",
      sender: "u1",
      receiver: "admin",
      message: "Hello world",
      type: "text",
    });

    render(<UserChatPage />);

    const input = await screen.findByRole("textbox");
    await userEvent.type(input, "Hello world");

    const sendBtn = screen.getByRole("button", { name: /send/i });
    await userEvent.click(sendBtn);

    await waitFor(() =>
      expect(chatApi.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Hello world",
          type: "text",
        })
      )
    );

    expect(await screen.findByText("Hello world")).toBeInTheDocument();
  });

  it("sends a voice message", async () => {
    (chatApi.upload as jest.Mock).mockResolvedValue({
      fileUrl: "/uploads/test.wav",
    });
    (chatApi.sendMessage as jest.Mock).mockResolvedValue({
      _id: "m2",
      sender: "u1",
      receiver: "admin",
      message: "",
      fileUrl: "/uploads/test.wav",
      type: "audio",
    });

    render(<UserChatPage />);

    const recordBtn = screen.getByText("● Voice");
    await userEvent.click(recordBtn);

    await waitFor(() =>
      expect(chatApi.upload).toHaveBeenCalledWith(expect.any(Blob))
    );
    expect(await screen.findByText(/test.wav/i)).toBeInTheDocument();
  });

  it("renders empty state initially", async () => {
    render(<UserChatPage />);
    expect(await screen.findByText(/no messages/i)).toBeInTheDocument();
  });
});
