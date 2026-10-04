'use client';
import { motion, AnimatePresence } from 'framer-motion';

/** A found object: letter, register page, photograph caption. Diegetic, quiet. */
export default function ArtifactOverlay({
  artifact,
  onClose,
}: {
  artifact: { title: string; body: string; sign?: string } | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {artifact && (
        <motion.div
          className="absolute inset-0 z-40 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/55" />
          <motion.div
            initial={{ y: 18, opacity: 0, rotate: -0.5 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 210, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[80%] w-full max-w-md overflow-y-auto rounded-[3px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
            style={{
              background:
                'linear-gradient(160deg, #e8d9b8 0%, #dfc9a0 55%, #d3b98e 100%)',
              color: '#3a2c1c',
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background:
                  'radial-gradient(ellipse at 30% 20%, rgba(120,85,40,0.25), transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(120,85,40,0.3), transparent 55%)',
              }}
            />
            <p className="relative font-display text-lg tracking-wide opacity-70">{artifact.title}</p>
            <div className="relative mt-3 whitespace-pre-line font-serif text-[17px] italic leading-relaxed">
              {artifact.body}
            </div>
            {artifact.sign && (
              <p className="relative mt-4 text-right font-serif text-[15px] opacity-70">{artifact.sign}</p>
            )}
            <button
              onClick={onClose}
              aria-label="Put it back"
              className="absolute right-3 top-3 rounded-full px-3 py-1 text-sm text-[#3a2c1c]/60 transition-colors hover:bg-black/10 hover:text-[#3a2c1c]"
            >
              ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
