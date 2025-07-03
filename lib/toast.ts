// Simple toast implementation without external dependencies
class ToastManager {
  private container: HTMLDivElement | null = null

  private createContainer() {
    if (this.container) return this.container

    this.container = document.createElement("div")
    this.container.className = "fixed top-4 right-4 z-50 space-y-2"
    document.body.appendChild(this.container)
    return this.container
  }

  private showToast(message: string, type: "success" | "error" | "info") {
    if (typeof window === "undefined") {
      console.log(`${type.toUpperCase()}: ${message}`)
      return
    }

    const container = this.createContainer()
    const toast = document.createElement("div")

    const bgColor = {
      success: "bg-green-500",
      error: "bg-red-500",
      info: "bg-blue-500",
    }[type]

    toast.className = `${bgColor} text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full opacity-0`
    toast.textContent = message

    container.appendChild(toast)

    // Animate in
    setTimeout(() => {
      toast.classList.remove("translate-x-full", "opacity-0")
    }, 10)

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add("translate-x-full", "opacity-0")
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast)
        }
      }, 300)
    }, 3000)
  }

  success(message: string) {
    this.showToast(message, "success")
  }

  error(message: string) {
    this.showToast(message, "error")
  }

  info(message: string) {
    this.showToast(message, "info")
  }
}

export const toast = new ToastManager()
