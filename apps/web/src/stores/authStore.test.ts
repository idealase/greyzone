import { useAuthStore } from "./authStore";

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.getState().clear();
  });

  it("stores user and tokens via setAuth", () => {
    useAuthStore.getState().setAuth({
      user: {
        id: "u1",
        username: "operator",
        display_name: "Operator",
        email: "operator@example.com",
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
      },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    const state = useAuthStore.getState();
    expect(state.user?.username).toBe("operator");
    expect(state.accessToken).toBe("access-token");
    expect(state.refreshToken).toBe("refresh-token");
  });

  it("clear removes user and tokens", () => {
    useAuthStore.getState().setAuth({
      user: {
        id: "u1",
        username: "operator",
        display_name: "Operator",
        email: "operator@example.com",
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
      },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    useAuthStore.getState().clear();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });
});
