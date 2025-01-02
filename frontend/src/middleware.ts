import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const HTTPSAPIURL = process.env.NEXT_PUBLIC_HTTPS_API_URL;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAuth = request.cookies.get("userAuth")?.value;

  console.log("User Auth Token:", userAuth); // Log token for debugging

  // Redirect jika sudah signin dan mencoba mengakses /signin atau /signup
  if (
    (pathname === "/auth/signin" || pathname === "/auth/signup") &&
    userAuth &&
    userAuth !== "guest"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect jika belum signin dan mencoba mengakses rute selain /signin dan /signup
  if (
    !userAuth &&
    (pathname !== "/auth/signin" && pathname !== "/signup")
  ) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // Redirect jika guest mencoba mengakses rute yang membutuhkan otentikasi
  if (
    (pathname === "/accounts" ||
      pathname === "/control" ||
      pathname === "/configurations") &&
    userAuth === "guest"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Validasi token jika bukan guest dan mengakses rute yang memerlukan otentikasi
  if (
    userAuth !== "guest" &&
    (pathname === "/accounts" ||
      pathname === "/control" ||
      pathname === "/configurations")
  ) {
    try {
      const response = await fetch(
        `https://${HTTPSAPIURL}/api/users/token/validator`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userAuth}`, // Use Bearer token if required
          },
        }
      );

      console.log("API Response Status:", response.status); // Log API response status
      const data = await response.json();
      console.log("API Response Data:", data); // Log API response data

      if (!response.ok || data.error) {
        console.error("Invalid token or API response error:", data.error);
        return NextResponse.redirect(new URL("/auth/signin", request.url));
      }

      // Token valid, lanjutkan
      return NextResponse.next();
    } catch (error) {
      console.error("Error validating token:", error);
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
  }

  // Allow access if all conditions are met
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/accounts",
    "/auth/signin",
    "/auth/signup",
    "/downtime",
    "/control",
    "/sensor",
    "/configurations",
  ],
};