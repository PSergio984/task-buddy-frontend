import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { CheckCircle2, Layout, Shield, Zap, ArrowRight, Star, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PwaInstallButton } from "@/components/pwa-install-button"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function LandingPage() {
  const scrollToPwa = () => {
    const element = document.getElementById("pwa-install")
    element?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="flex min-h-svh flex-col bg-background selection:bg-accent/30 selection:text-accent">
      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <span className="font-heading text-2xl font-bold tracking-tight">Task Buddy</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Features</a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Community</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button className="rounded-full px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 -z-10 left-1/2 -translate-x-1/2 blur-3xl opacity-20">
            <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-accent to-purple-400" />
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-1.5 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-accent" />
              <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">The future of productivity</span>
            </motion.div>
            <motion.h1 variants={itemVariants} className="mb-8 font-heading text-6xl font-bold tracking-tight sm:text-8xl">
              Organize your life, <br />
              <span className="text-accent">beautifully.</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
              Task Buddy is the calm in the middle of the storm. A simple, elegant, and powerful tool designed to help you stay focused on what truly matters.
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/register">
                <Button size="lg" className="h-14 rounded-full px-10 text-lg shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                  Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-14 rounded-full px-10 text-lg backdrop-blur-sm shadow-none border-foreground/10 hover:bg-foreground/5 gap-2"
                onClick={scrollToPwa}
              >
                <Download className="h-5 w-5" />
                Install App
              </Button>
            </motion.div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
            className="mt-20 flex justify-center"
          >
            <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border bg-background/30 p-2 shadow-2xl backdrop-blur-md">
              <div className="rounded-2xl border bg-background shadow-inner overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=2000"
                  alt="Dashboard Preview"
                  className="w-full opacity-90 transition-opacity hover:opacity-100"
                />
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-secondary/30 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-20 text-center">
              <h2 className="font-heading text-4xl font-bold sm:text-5xl mb-4">Everything you need to thrive</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Focus on your goals while we handle the complexity of organization.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Zap, title: "Lightning Fast", description: "Zero lag, real-time sync across all your devices instantly." },
                { icon: Layout, title: "Intuitive Design", description: "Clean, minimal interface that stays out of your way." },
                { icon: Shield, title: "Private & Secure", description: "Your data is encrypted and only accessible by you." },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group rounded-3xl border bg-background p-8 transition-all hover:border-accent hover:shadow-lg"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials/Lifestyle Section */}
        <section id="testimonials" className="py-24 sm:py-32 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="font-heading text-4xl font-bold sm:text-5xl mb-6">Built for the modern lifestyle</h2>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    "Task Buddy has completely changed how I manage my freelance projects. It's not just a tool, it's a productivity companion that feels premium and personal."
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-accent to-purple-400" />
                    <div>
                      <p className="font-bold">Sarah Jenkins</p>
                      <p className="text-sm text-muted-foreground">Digital Nomad & Designer</p>
                    </div>
                  </div>
                </motion.div>
              </div>
              <div className="flex-1 relative">
                 <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="space-y-4 pt-8">
                    <div className="aspect-square rounded-3xl bg-secondary/50 p-4 border flex items-center justify-center">
                      <Star className="h-12 w-12 text-accent" />
                    </div>
                    <div className="aspect-video rounded-3xl bg-primary text-primary-foreground p-6 flex flex-col justify-end">
                      <p className="text-2xl font-bold">50k+</p>
                      <p className="text-sm opacity-80">Active Buddies</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="aspect-[3/4] rounded-3xl bg-accent text-accent-foreground p-6 flex flex-col justify-end">
                      <p className="text-2xl font-bold tracking-tight">Focus Mode</p>
                      <p className="text-sm opacity-80">Distraction free</p>
                    </div>
                    <div className="aspect-square rounded-3xl bg-secondary/50 border" />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* PWA Installation Section */}
        <section id="pwa-install" className="bg-background py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[3rem] bg-secondary/30 border p-8 md:p-16">
              <div className="flex flex-col lg:flex-row items-center gap-12">
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="font-heading text-4xl font-bold sm:text-5xl mb-6">Experience Task Buddy <span className="text-accent">Anywhere</span></h2>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl">
                    Install Task Buddy as a desktop or mobile app. Enjoy faster load times, offline access, and a distraction-free environment tailored for high-performance work.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                    <PwaInstallButton 
                      isCollapsed={false}
                      className="h-14 rounded-full px-10 text-lg shadow-xl shadow-primary/20" 
                    />
                    <p className="text-sm text-muted-foreground font-medium italic">
                      No App Store needed. Installs directly from your browser.
                    </p>
                  </div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="relative w-full max-w-md aspect-square rounded-[2.5rem] bg-gradient-to-tr from-primary/10 to-accent/10 border-2 border-dashed border-primary/20 flex items-center justify-center overflow-hidden">
                     <Download className="w-32 h-32 text-primary/20 absolute animate-pulse" />
                     <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        className="relative z-10 bg-background rounded-3xl p-6 shadow-2xl border"
                     >
                        <div className="flex items-center gap-4 mb-4">
                           <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                              <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
                           </div>
                           <div>
                              <p className="font-bold">Task Buddy</p>
                              <p className="text-xs text-muted-foreground">Ready to install</p>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <div className="h-2 w-32 bg-secondary rounded-full" />
                           <div className="h-2 w-24 bg-secondary rounded-full opacity-50" />
                        </div>
                     </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-5xl rounded-[3rem] bg-primary px-8 py-16 text-center text-primary-foreground sm:py-24"
          >
            <h2 className="mb-6 font-heading text-4xl font-bold sm:text-6xl">Ready to find your focus?</h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg opacity-80 sm:text-xl">
              Join thousands of people who have simplified their workflow with Task Buddy.
            </p>
            <Link to="/register">
              <Button size="lg" className="h-14 rounded-full bg-background px-10 text-lg text-primary hover:bg-secondary transition-all hover:scale-105 active:scale-95">
                Join Task Buddy Now
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className="border-t bg-secondary/20 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-accent" />
            <span className="font-heading text-xl font-bold">Task Buddy</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Task Buddy Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="https://twitter.com/taskbuddy" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">Twitter</a>
            <a href="https://github.com/taskbuddy" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">GitHub</a>
            <a href="/privacy" className="text-muted-foreground hover:text-primary">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
