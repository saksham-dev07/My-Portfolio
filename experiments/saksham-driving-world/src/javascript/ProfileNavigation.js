import { profileSections } from './sakshamProfile.js'

export const educationChapterIndices=Object.freeze({school:2,science:1,campus:0})

// World pads may select a real education chapter; strings remain compatible
// with existing signs, navigation and portfolio links.
export function profileRequest(detail) {
    const id=typeof detail==='string' ? detail : detail?.id
    if(!profileSections.some(section=>section.id===id)) return null
    const chapter=id==='education' && Object.hasOwn(educationChapterIndices,detail?.chapter) ? detail.chapter : null
    return {id,chapter}
}

export function profileEntryOrder(id,entries,chapter) {
    const selected=id==='education' && Object.hasOwn(educationChapterIndices,chapter) ? educationChapterIndices[chapter] : -1
    return entries.map((entry,index)=>({entry,selected:index===selected})).sort((a,b)=>Number(b.selected)-Number(a.selected))
}
