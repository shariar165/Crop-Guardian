export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center sm:items-center sm:py-8">
      <div className="relative flex min-h-dvh w-full max-w-[390px] flex-col overflow-hidden bg-cream sm:min-h-[844px] sm:rounded-[36px] sm:shadow-[0_10px_40px_rgba(43,30,22,0.18)]">
        {children}
      </div>
    </div>
  )
}
