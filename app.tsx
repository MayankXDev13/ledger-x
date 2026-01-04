import "react-native-get-random-values";
import { Buffer } from "buffer";
import { EventEmitter } from "events";

if (typeof globalThis.Buffer === "undefined") {
  globalThis.Buffer = Buffer;
}

if (typeof globalThis.EventEmitter === "undefined") {
  globalThis.EventEmitter = EventEmitter;
}

import { useEffect } from "react";
import { Redirect } from "expo-router";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import Index from "./app/index";

export default function IndexRedirect() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      router.replace("/customers");
    }
  }, [session, loading]);

  if (loading) {
    return null;
  }

  if (session) {
    return <Redirect href="/customers" />;
  }

  return <Index />;
}
