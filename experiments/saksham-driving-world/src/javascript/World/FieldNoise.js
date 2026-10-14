export const smoothRange=(a,b,value)=>{const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t)}
export function seededRandom(seed){return()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296}}
export function noiseHash(x,y,seed){let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(seed,1274126177);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295}
export function fieldNoise(x,y,seed=18276){
    const ix=Math.floor(x),iy=Math.floor(y),u=smoothRange(0,1,x-ix),v=smoothRange(0,1,y-iy)
    const a=noiseHash(ix,iy,seed),b=noiseHash(ix+1,iy,seed),c=noiseHash(ix,iy+1,seed),d=noiseHash(ix+1,iy+1,seed)
    return(a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v
}
export function rollingMeadow(x,y,config){return config.hillHeight*(.7*fieldNoise(x/18,y/18,config.seed)+.3*fieldNoise(x/41,y/41,config.seed+9))}
