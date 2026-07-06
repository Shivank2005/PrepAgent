"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

export default function Providers({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "dummy_client_id_for_development";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
