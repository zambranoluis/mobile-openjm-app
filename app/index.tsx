import { Redirect } from "expo-router";
import { useAuth } from "../src/features/auth/AuthProvider";
export default function Index() {
  const { profile } = useAuth();
  return (
    <Redirect
      href={
        !profile
          ? "/login"
          : profile.profileComplete
            ? "/(tabs)"
            : "/complete-profile"
      }
    />
  );
}
