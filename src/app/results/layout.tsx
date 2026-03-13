import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Poll Results - PulsePoll",
  description: "View poll results and voting statistics",
};

export default function ResultsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
