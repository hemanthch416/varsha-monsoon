import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// Mocks — no real network in tests.
const { completeOnboardingMock, navigateMock, toastMock } = vi.hoisted(() => ({
  completeOnboardingMock: vi.fn(),
  navigateMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock("@/services/profile", () => ({
  completeOnboarding: completeOnboardingMock,
  getProfile: vi.fn(async () => null),
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" }, session: null, loading: false, signOut: vi.fn() }),
}));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
  toast: toastMock,
}));
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

import Onboarding from "@/pages/Onboarding";

const renderPage = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Onboarding />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("Onboarding form", () => {
  beforeEach(() => {
    completeOnboardingMock.mockReset();
    navigateMock.mockReset();
    toastMock.mockReset();
  });

  it("shows a validation toast and does not submit when city is empty", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /continue to dashboard/i }));
    await waitFor(() => expect(toastMock).toHaveBeenCalled());
    expect(toastMock.mock.calls[0][0]).toMatchObject({ variant: "destructive" });
    expect(completeOnboardingMock).not.toHaveBeenCalled();
  });

  it("submits valid input and navigates to /dashboard on success", async () => {
    completeOnboardingMock.mockResolvedValueOnce({ id: "user-1" });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/city/i), "Mumbai");
    await user.type(screen.getByLabelText(/locality/i), "Andheri West");
    await user.click(screen.getByRole("button", { name: /continue to dashboard/i }));

    await waitFor(() =>
      expect(completeOnboardingMock).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ city: "Mumbai", locality: "Andheri West" }),
      ),
    );
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/dashboard"));
  });
});
