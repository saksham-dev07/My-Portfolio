export function yieldStartupTask(){
    if(globalThis.scheduler?.yield)return globalThis.scheduler.yield()
    return new Promise(resolve=>setTimeout(resolve,0))
}

// A single preparation promise owns readiness, including shader warm-up.
// Input may reveal the scene only after these stages have completed.
export default class WorldPreparation{
    constructor({steps,onProgress=()=>{},cancelled=()=>false,yieldTask=yieldStartupTask}){
        Object.assign(this,{steps,onProgress,cancelled,yieldTask});this.ready=false;this.state='idle'
    }
    prepare(){
        if(this.promise)return this.promise
        this.state='preparing'
        this.promise=(async()=>{
            for(let i=0;i<this.steps.length;i++){
                const step=this.steps[i]
                this.onProgress({progress:i/this.steps.length,message:step.message})
                await this.yieldTask()
                if(this.cancelled()){this.state='cancelled';return false}
                await step.run()
            }
            if(this.cancelled()){this.state='cancelled';return false}
            this.ready=true;this.state='ready';this.onProgress({progress:1,message:'World ready. Your curiosity supplies the direction.'})
            return true
        })().catch(error=>{this.state='error';throw error})
        return this.promise
    }
}
