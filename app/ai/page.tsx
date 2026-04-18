"use client";

import { motion } from "framer-motion";
import { ChatWindow } from "@/components/ai/ChatWindow";

export default function AIPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <ChatWindow />
    </motion.div>
  );
}
