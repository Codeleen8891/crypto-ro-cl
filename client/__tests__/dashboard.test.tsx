import { render, screen, waitFor } from "@testing-library/react";
import DashboardHome from "../app/dashboard/page";
import { LanguageProvider } from "@/contexts/LanguageContext";

jest.mock("@/lib/api", () => ({
  userApi: {
    stats: jest.fn().mockResolvedValue({ shares: 10, referrals: 5 }), // match component
    me: jest.fn().mockResolvedValue({ name: "Admin" }),
  },
}));

describe("Dashboard Home", () => {
  it("renders user stats from API", async () => {
    render(
      <LanguageProvider>
        <DashboardHome />
      </LanguageProvider>
    );

    // ✅ wait for API-driven content
    await waitFor(async () => {
      expect(await screen.findByText(/shares/i)).toBeInTheDocument();
      expect(await screen.findByText(/10/)).toBeInTheDocument();

      expect(await screen.findByText(/referrals/i)).toBeInTheDocument();
      expect(await screen.findByText(/5/)).toBeInTheDocument();
    });
  });

  it("renders admin name from API", async () => {
    render(
      <LanguageProvider>
        <DashboardHome />
      </LanguageProvider>
    );

    expect(await screen.findByText(/admin/i)).toBeInTheDocument();
  });
});
