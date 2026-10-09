// One optional activity owns the car at a time. Games keep their own simulation;
// this boundary only switches sessions and routes explicit player actions.
export default class ActivityDirector {
    constructor({ resolve, onChange = () => {} }) {
        this.resolve = resolve
        this.onChange = onChange
        this.current = null
    }

    start(id) {
        const game = this.resolve(id)
        if (!game || game.id !== id || typeof game.start !== 'function') return false
        this.stop()
        this.current = game
        try {
            if (game.start() === false) {
                this.current = null
                game.stop?.()
                this.onChange(null)
                return false
            }
        } catch (error) {
            this.current = null
            game.stop?.()
            this.onChange(null)
            throw error
        }
        this.onChange(game)
        return true
    }

    action(action) {
        if (!this.current || typeof action !== 'string') return false
        if (action === 'quit' || action === 'exit') { this.stop(); return true }
        this.current.handleAction?.(action)
        return true
    }

    stop() {
        const previous = this.current
        this.current = null
        previous?.stop?.()
        this.onChange(null)
    }
}
