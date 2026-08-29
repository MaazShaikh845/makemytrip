"use client";

import { ReactNode, useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import store, { setUser } from "@/store";

function AuthHydrator({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("authUser");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user) {
          dispatch(setUser(user));
        }
      }
    } catch (err) {
      console.error("Failed to restore user from localStorage:", err);
    }
  }, [dispatch]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <AuthHydrator>{children}</AuthHydrator>
    </Provider>
  );
}
