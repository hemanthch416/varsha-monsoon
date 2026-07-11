import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

const askAssistantMock = vi.fn();
const listChatMock = vi.fn();
const toastMock = vi.fn();

vi.mock("@/services/ai", () => ({
  askAssistant: (...args: unknown[]) => askAssistantMock(...args),
  fetchPreparednessPlan: vi.fn(),
}));
vi.mock("@/services/chat", () => ({
  listChat: (...args: unknown[]) => listChatMock(...args),
  appendChat: vi.fn(),
}));
vi.mock("@/services/profile", () => ({
  getProfile: vi.fn(async () => ({ id: "user-1", language: "en" })),
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" }, session: null, loading: false, signOut: vi.fn() }),
}));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
  toast: toastMock,
}));
vi.mock("@/hooks/useAlertState", () => ({
  useAlertState: () => ({
    state: { status: "before", severity: "normal", headline: "", description: "", eventStart: null, sourceIds: [] },
    transition: null,
    dismissTransition: vi.fn(),
  }),
}));

import Assistant from "@/pages/Assistant";

const renderPage = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Assistant />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("Assistant chat flow", () => {
  beforeEach(() => {
    askAssistantMock.mockReset();
    listChatMock.mockReset();
    toastMock.mockReset();
  });

  it("sends a message and shows the assistant reply", async () => {
    // First call returns empty history; refetch after send returns the pair.
    listChatMock
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        { id: "m1", role: "user", message: "hello", created_at: new Date().toISOString() },
        { id: "m2", role: "assistant", message: "Hi there — how can I help?", created_at: new Date().toISOString() },
      ]);
    let resolveReply: (v: string) => void = () => {};
    askAssistantMock.mockImplementationOnce(
      () => new Promise<string>((r) => { resolveReply = r; }),
    );

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/your question/i), "hello");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    // Loading state visible while the request is in-flight.
    await waitFor(() => expect(screen.getByText(/thinking…/i)).toBeInTheDocument());

    resolveReply("Hi there — how can I help?");

    await waitFor(() =>
      expect(screen.getByText(/hi there — how can i help\?/i)).toBeInTheDocument(),
    );
    expect(askAssistantMock).toHaveBeenCalledWith("hello");
  });

  it("shows an error toast when the assistant call fails", async () => {
    listChatMock.mockResolvedValue([]);
    askAssistantMock.mockRejectedValueOnce(new Error("boom"));

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/your question/i), "hello");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => expect(toastMock).toHaveBeenCalled());
    expect(toastMock.mock.calls[0][0]).toMatchObject({
      title: expect.stringMatching(/unavailable/i),
      variant: "destructive",
    });
  });
});
