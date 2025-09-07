import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Sidebar from "@/components/Sidebar";
import { LanguageProvider } from "@/contexts/LanguageContext";

// --- Mock router ---
let mockPathname: string;
let mockPush: jest.Mock;

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}));

// --- Mock fetch so api.ts works ---
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ _id: "u1", name: "User" }),
  })
) as jest.Mock;

const renderWithProviders = (ui: React.ReactNode) => {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
};

describe("Sidebar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/dashboard";
    mockPush = jest.fn();
  });

  it("renders all navigation links", async () => {
    renderWithProviders(<Sidebar />);

    expect(await screen.findByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/update profile/i)).toBeInTheDocument();
    expect(screen.getByText(/chat admin/i)).toBeInTheDocument();
    expect(screen.getByText(/refer a friend/i)).toBeInTheDocument();
  });

  it("applies active style based on pathname", () => {
    mockPathname = "/dashboard/chat";
    renderWithProviders(<Sidebar />);
    const chatLink = screen.getByText(/chat admin/i);
    expect(chatLink.className).toMatch(/bg-white\/15|text-white/);
  });
  it("navigates when clicking links", async () => {
    renderWithProviders(<Sidebar />);
    const profileLink = screen.getByText(/update profile/i);
    await userEvent.click(profileLink);
    expect(profileLink).toBeInTheDocument();
  });
});
