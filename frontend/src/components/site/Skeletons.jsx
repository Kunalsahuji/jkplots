import React from "react";

export function PropertyCardSkeleton() {
  return (
    <div className="block overflow-hidden rounded-2xl border border-border bg-card shadow-soft animate-pulse">
      {/* Aspect Ratio Box for Image */}
      <div className="relative aspect-[4/3] bg-muted/60" />

      {/* Content Skeleton */}
      <div className="space-y-3 p-4">
        {/* Title bar */}
        <div className="h-4 w-3/4 rounded-lg bg-muted/70" />
        
        {/* Locality & City bar */}
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full bg-muted/60" />
          <div className="h-3 w-1/2 rounded-md bg-muted/60" />
        </div>

        {/* Divider & Footer values */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3.5">
          {/* Price */}
          <div className="h-5 w-1/3 rounded-lg bg-muted/80" />
          
          {/* Badges */}
          <div className="flex gap-1.5">
            <div className="h-4.5 w-12 rounded-full bg-muted/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PropertyGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PropertyDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Large Image Showcase Skeleton */}
      <div className="relative h-[250px] sm:h-[400px] w-full bg-muted/50" />

      <div className="container-px mx-auto max-w-7xl py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          {/* Left Main Details */}
          <div className="space-y-6">
            {/* Title / Badges block */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded-full bg-muted" />
                <div className="h-5 w-24 rounded-full bg-muted" />
              </div>
              <div className="h-8 w-2/3 rounded-lg bg-muted" />
              <div className="h-4 w-1/3 rounded-md bg-muted" />
            </div>

            {/* Quick Specs blocks */}
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border p-4 sm:grid-cols-4 bg-card">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5 items-center justify-center p-2">
                  <div className="h-5 w-5 rounded bg-muted" />
                  <div className="h-4 w-12 rounded bg-muted" />
                  <div className="h-3 w-16 rounded bg-muted" />
                </div>
              ))}
            </div>

            {/* Description block */}
            <div className="space-y-3 rounded-2xl border border-border p-6 bg-card">
              <div className="h-6 w-32 rounded bg-muted" />
              <div className="space-y-2 pt-2">
                <div className="h-3.5 w-full rounded bg-muted" />
                <div className="h-3.5 w-full rounded bg-muted" />
                <div className="h-3.5 w-[90%] rounded bg-muted" />
                <div className="h-3.5 w-[85%] rounded bg-muted" />
              </div>
            </div>
          </div>

          {/* Right Sidebar Enquiry card */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
              <div className="h-6 w-1/2 rounded bg-muted" />
              <div className="space-y-3 pt-2">
                <div className="h-10 w-full rounded-xl bg-muted" />
                <div className="h-10 w-full rounded-xl bg-muted" />
                <div className="h-10 w-full rounded-xl bg-muted" />
              </div>
              <div className="h-12 w-full rounded-xl bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-secondary/10 py-8 animate-pulse">
      <div className="container-px mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="h-24 rounded-2xl bg-muted" />
            <div className="space-y-2 rounded-2xl border border-border bg-card p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 rounded-xl bg-muted" />
              ))}
            </div>
          </div>

          {/* Main content pane */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-8 w-48 rounded bg-muted" />
                <div className="h-4 w-32 rounded bg-muted" />
              </div>
              <div className="h-10 w-32 rounded-full bg-muted" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="h-28 rounded-2xl bg-muted" />
              <div className="h-28 rounded-2xl bg-muted" />
              <div className="h-28 rounded-2xl bg-muted" />
            </div>

            <div className="space-y-3">
              <div className="h-6 w-36 rounded bg-muted" />
              <div className="h-40 rounded-2xl bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
