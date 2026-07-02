import type { ReactNode } from "react";
import { ArticleLayout } from "@/components/layout/article-layout";
import { AsideLinks } from "@/components/layout/aside-links";
import type { AsideLink } from "@/components/layout/aside-links";
import { TopicBreadcrumb } from "@/components/layout/topic-breadcrumb";
import { TopicNav } from "@/components/layout/topic-nav";
import { SupportAside } from "@/components/support/support-aside";

export function TopicPageLayout({
  children,
  aside,
}: {
  children: ReactNode;
  aside: AsideLink[];
}) {
  return (
    <ArticleLayout
      aside={<AsideLinks links={aside} footer={<SupportAside />} />}
      asideTopClass="lg:mt-[7.25rem]"
    >
      <TopicBreadcrumb />
      {children}
      <TopicNav />
    </ArticleLayout>
  );
}
