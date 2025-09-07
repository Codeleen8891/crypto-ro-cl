import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "../app/(auth)/register/page";
import VerifyOtpPage from "../app/(auth)/verify-otp/page";
import LoginPage from "../app/(auth)/login/page";
import ResetPasswordPage from "../app/(auth)/reset-password/[token]/page";
import { authApi } from "@/lib/api";

// --- router mock ---
let mockPush: jest.Mock;
jest.mock("next/navigation", () => {
  return {
    useRouter: () => {
      return { push: mockPush, replace: jest.fn(), prefetch: jest.fn() };
    },
    useSearchParams: () =>
      new URLSearchParams("email=john@test.com&token=reset-token"),
  };
});

// --- API mock ---
jest.mock("@/lib/api", () => ({
  authApi: {
    register: jest.fn(),
    verifyOtp: jest.fn(),
    login: jest.fn(),
    resendOtp: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  },
}));

describe("Full Auth Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush = jest.fn();
    localStorage.clear();
  });

  it("registers → verifies OTP → logs in → redirects to dashboard", async () => {
    // 1. REGISTER
    (authApi.register as jest.Mock).mockResolvedValue({
      message: "OTP sent to email",
    });

    render(<RegisterPage />);
    fireEvent.change(screen.getByPlaceholderText(/full name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: "john@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "mypassword" },
    });
    fireEvent.submit(screen.getByTestId("register-form"));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalled();
      const arg = (authApi.register as jest.Mock).mock.calls[0][0];
      expect(arg).toBeInstanceOf(FormData);
      expect(arg.get("name")).toBe("John Doe");
      expect(arg.get("email")).toBe("john@test.com");
      expect(arg.get("password")).toBe("mypassword");
    });

    // 2. VERIFY OTP
    (authApi.verifyOtp as jest.Mock).mockResolvedValue({
      message: "Account verified",
    });

    render(<VerifyOtpPage />);
    fireEvent.change(screen.getByPlaceholderText(/enter otp/i), {
      target: { value: "123456" },
    });
    fireEvent.submit(screen.getByTestId("register-form"));

    await waitFor(() =>
      expect(authApi.verifyOtp).toHaveBeenCalledWith({
        email: "john@test.com",
        otp: "123456",
      })
    );

    // 3. LOGIN
    (authApi.login as jest.Mock).mockResolvedValue({
      token: "fake-token",
      user: { role: "user", _id: "123" },
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText(/^email$/i), {
      target: { value: "john@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "mypassword" },
    });
    fireEvent.submit(screen.getByTestId("register-form"));

    await waitFor(() =>
      expect(authApi.login).toHaveBeenCalledWith({
        email: "john@test.com",
        password: "mypassword",
      })
    );

    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("handles forgot password → reset password", async () => {
    // 1. FORGOT PASSWORD
    (authApi.forgotPassword as jest.Mock).mockResolvedValue({
      message: "Reset link sent to email",
    });

    render(<LoginPage />);
    const forgotLink = screen.getByText(/forgot password/i);
    fireEvent.click(forgotLink);

    fireEvent.change(screen.getByPlaceholderText(/^email$/i), {
      target: { value: "john@test.com" },
    });
    fireEvent.submit(screen.getByTestId("forgot-form"));

    await waitFor(() =>
      expect(authApi.forgotPassword).toHaveBeenCalledWith({
        email: "john@test.com",
      })
    );

    // 2. RESET PASSWORD (simulate clicking link with token+email in URL)
    (authApi.resetPassword as jest.Mock).mockResolvedValue({
      message: "Password reset successful",
    });

    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText(/new password/i), {
      target: { value: "newpassword" },
    });
    fireEvent.submit(screen.getByTestId("reset-form"));

    await waitFor(() =>
      expect(authApi.resetPassword).toHaveBeenCalledWith({
        email: "john@test.com",
        token: "reset-token",
        password: "newpassword",
      })
    );

    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
