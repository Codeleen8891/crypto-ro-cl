import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "../app/dashboard/update-profile/page";
import { userApi } from "@/lib/api";

// --- Mock API ---
jest.mock("@/lib/api", () => ({
  userApi: {
    me: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    requestPasswordOtp: jest.fn(),
    resetPasswordWithOtp: jest.fn(),
  },
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("token", "fake-token");
    (userApi.me as jest.Mock).mockResolvedValue({
      _id: "u1",
      name: "Test User",
      email: "test@example.com",
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders profile update form", async () => {
    render(<SettingsPage />);

    expect(
      await screen.findByPlaceholderText(/full name/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/change password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("submits profile update", async () => {
    (userApi.updateProfile as jest.Mock).mockResolvedValue({
      name: "Updated User",
    });

    render(<SettingsPage />);

    const nameInput = await screen.findByPlaceholderText(/full name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Updated User");

    const saveBtn = screen.getByRole("button", { name: /save/i });
    await userEvent.click(saveBtn);

    await waitFor(() => {
      // ✅ expect FormData (not object + token)
      expect(userApi.updateProfile).toHaveBeenCalledWith(expect.any(FormData));
    });
  });

  it("changes password using old password", async () => {
    (userApi.changePassword as jest.Mock).mockResolvedValue({ success: true });

    render(<SettingsPage />);

    // open modal
    await userEvent.click(
      screen.getByRole("button", { name: /change password/i })
    );

    const oldPassInput = await screen.findByPlaceholderText(/old password/i);
    const newPassInput = screen.getByPlaceholderText(/new password/i);

    await userEvent.type(oldPassInput, "oldpass");
    await userEvent.type(newPassInput, "newpass");

    const submitBtn = screen.getByRole("button", { name: /submit/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      // ✅ expect object payload (not raw args)
      expect(userApi.changePassword).toHaveBeenCalledWith({
        oldPassword: "oldpass",
        newPassword: "newpass",
      });
    });
  });

  it("resets password with OTP flow", async () => {
    (userApi.requestPasswordOtp as jest.Mock).mockResolvedValue({
      success: true,
    });
    (userApi.resetPasswordWithOtp as jest.Mock).mockResolvedValue({
      success: true,
    });

    render(<SettingsPage />);

    // open modal
    await userEvent.click(
      screen.getByRole("button", { name: /change password/i })
    );

    // ✅ no "Use OTP" toggle in component → directly trigger OTP request
    const oldPassInput = screen.getByPlaceholderText(/old password/i);
    await userEvent.clear(oldPassInput); // leave blank → triggers OTP

    const newPassInput = screen.getByPlaceholderText(/new password/i);
    await userEvent.type(newPassInput, "newpass123");

    const submitBtn = screen.getByRole("button", { name: /submit/i });
    await userEvent.click(submitBtn);

    // First: OTP request
    await waitFor(() => {
      expect(userApi.requestPasswordOtp).toHaveBeenCalled();
    });

    // Manually simulate OTP step
    (userApi.resetPasswordWithOtp as jest.Mock).mockResolvedValue({
      success: true,
    });

    const otpInput = await screen.findByPlaceholderText(/enter otp/i);
    await userEvent.type(otpInput, "123456");
    await userEvent.clear(newPassInput);
    await userEvent.type(newPassInput, "newpass123");

    await userEvent.click(submitBtn);

    await waitFor(() => {
      // ✅ expect object payload (not email + otp + password)
      expect(userApi.resetPasswordWithOtp).toHaveBeenCalledWith({
        otp: "123456",
        newPassword: "newpass123",
      });
    });
  });
});
