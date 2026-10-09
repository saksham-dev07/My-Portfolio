import { test,expect } from 'bun:test'
import { profileRequest,profileEntryOrder } from '../src/javascript/ProfileNavigation.js'
import { profileSections } from '../src/javascript/sakshamProfile.js'

test('education pads resolve only real chapters and preserve existing section navigation',()=>{
    expect(profileRequest('about')).toEqual({id:'about',chapter:null})
    expect(profileRequest({id:'education',chapter:'science'})).toEqual({id:'education',chapter:'science'})
    expect(profileRequest({id:'education',chapter:'constructor'})).toEqual({id:'education',chapter:null})
    expect(profileRequest({id:'about',chapter:'science'})).toEqual({id:'about',chapter:null})
    expect(profileRequest({id:'unknown',chapter:'science'})).toBeNull()
    expect(profileRequest(null)).toBeNull()
})

test('each education stop emphasizes its own accurate source entry without losing other chapters',()=>{
    const entries=profileSections.find(section=>section.id==='education').entries
    const original=JSON.stringify(entries)
    for(const [chapter,year] of [['school','2019–2020'],['science','2021–2022'],['campus','2023–2027']]) {
        const ordered=profileEntryOrder('education',entries,chapter)
        expect(ordered[0].entry[0]).toContain(year)
        expect(ordered[0].selected).toBe(true)
        expect(ordered.filter(item=>item.selected)).toHaveLength(1)
        expect(ordered.map(item=>item.entry)).toHaveLength(entries.length)
    }
    expect(JSON.stringify(entries)).toBe(original)
    expect(profileEntryOrder('education',entries,null).map(item=>item.entry)).toEqual(entries)
    expect(profileEntryOrder('about',entries,'school').every(item=>!item.selected)).toBe(true)
})
