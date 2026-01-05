import "react-native-get-random-values";
import { Buffer } from "buffer";
import { EventEmitter } from "events";

(globalThis as { Buffer?: typeof Buffer }).Buffer = Buffer;
(globalThis as { EventEmitter?: typeof EventEmitter }).EventEmitter =
  EventEmitter;

import { useEffect } from "react";
import { Redirect } from "expo-router";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import Index from "./app/index";

export default function IndexRedirect() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      router.replace("/home");
    }
  }, [session, loading]);

  if (loading) {
    return null;
  }

  if (session) {
    return <Redirect href="/home" />;
  }

  return <Index />;
}
