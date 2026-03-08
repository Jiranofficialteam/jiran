import { Search } from "lucide-react";
import { useState } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { exploreImages } from "@/data/mockData";

const Explore = () => {
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-[935px] px-0 md:px-4 md:pt-4">
        {/* Search */}
        <div className="sticky top-14 z-40 bg-background px-4 pb-3 pt-2 md:static md:px-0 md:pt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg bg-secondary py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-border"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-0.5 md:gap-1">
          {exploreImages.map((img, i) => {
            const isLarge = i % 9 === 0;
            return (
              <button
                key={i}
                className={`relative aspect-square overflow-hidden ${isLarge ? "row-span-2 col-span-1 md:row-span-2" : ""}`}
              >
                <img
                  src={img}
                  alt=""
                  className="h-full w-full object-cover transition-opacity hover:opacity-90"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      </div>
      <BottomNav />
      <div className="h-14 md:hidden" />
    </div>
  );
};

export default Explore;
