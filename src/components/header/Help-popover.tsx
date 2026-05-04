"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  Book,
  MessageCircle,
  Video,
  Keyboard,
  ExternalLink,
  Mail,
} from "lucide-react";
import { useState } from "react";

const helpItems = [
  {
    icon: <Book className="h-4 w-4" />,
    title: "Documentation",
    description: "Learn how to use SheetSync",
    action: () => console.log("Open docs"),
  },
  {
    icon: <Video className="h-4 w-4" />,
    title: "Video Tutorials",
    description: "Watch step-by-step guides",
    action: () => console.log("Open tutorials"),
  },
  {
    icon: <Keyboard className="h-4 w-4" />,
    title: "Keyboard Shortcuts",
    description: "Speed up your workflow",
    action: () => console.log("Show shortcuts"),
  },
  {
    icon: <MessageCircle className="h-4 w-4" />,
    title: "Community Forum",
    description: "Ask questions & share tips",
    action: () => console.log("Open forum"),
  },
  {
    icon: <Mail className="h-4 w-4" />,
    title: "Contact Support",
    description: "Get help from our team",
    action: () => console.log("Open support"),
  },
];

const HelpPopover = () => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-4 border-b">
          <h4 className="font-semibold">Help & Resources</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Get help and learn more about SheetSync
          </p>
        </div>
        <div className="p-2">
          {helpItems.map((item, index) => (
            <button
              key={index}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
              onClick={() => {
                item.action();
                setOpen(false);
              }}
            >
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </button>
          ))}
        </div>
        <div className="p-3 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            SheetSync v1.0.0 • Made with ❤️
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default HelpPopover;
