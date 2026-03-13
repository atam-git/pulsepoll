import { ConfigurationParser, RawPollConfig } from '@/services/configParser'
import { ConfigurationValidator } from '@/services/configValidator'
import { PollSerializer } from '@/services/configSerializer'

function roundTrip(raw: RawPollConfig) {
  const parsed = ConfigurationParser.parse(raw)
  expect(parsed.success).toBe(true)
  const validated = ConfigurationValidator.validate(parsed.poll!)
  expect(validated.valid).toBe(true)
  const serialized = PollSerializer.serialize(parsed.poll!)
  const reparsed = ConfigurationParser.parse(serialized)
  expect(reparsed.success).toBe(true)
  return { first: parsed.poll!, second: reparsed.poll! }
}

function expectEquivalent(a: any, b: any) {
  expect(a.title).toBe(b.title)
  expect(a.description).toBe(b.description)
  expect(a.type).toBe(b.type)
  expect(a.privacy).toBe(b.privacy)
  expect(a.options.length).toBe(b.options.length)
  a.options.forEach((opt: any, i: number) => {
    expect(opt.text).toBe(b.options[i].text)
  })
  expect(a.settings.allowAnonymous).toBe(b.settings.allowAnonymous)
  expect(a.settings.requireCaptcha).toBe(b.settings.requireCaptcha)
}

const baseOptions = [{ text: 'Option A' }, { text: 'Option B' }]

describe('Config Round-Trip Integration Tests', () => {
  describe('All 5 poll types round-trip', () => {
    it.each(['single', 'multiple', 'ranking', 'yesno'] as const)(
      'should round-trip a %s poll config',
      (type) => {
        const raw: RawPollConfig = { title: 'Test Poll Title', type, options: baseOptions }
        const { first, second } = roundTrip(raw)
        expectEquivalent(first, second)
      }
    )

    it('should round-trip a survey poll config', () => {
      const raw: RawPollConfig = { title: 'Survey Title Here', type: 'survey', options: [{ text: 'Q1' }] }
      const { first, second } = roundTrip(raw)
      expectEquivalent(first, second)
    })
  })

  describe('Edge cases', () => {
    it('should round-trip a minimum valid config', () => {
      const raw: RawPollConfig = { title: 'ABCDE', type: 'survey', options: [{ text: 'A' }] }
      const { first, second } = roundTrip(raw)
      expectEquivalent(first, second)
    })

    it('should round-trip a maximum valid config', () => {
      const raw: RawPollConfig = {
        title: 'A'.repeat(200),
        description: 'D'.repeat(500),
        type: 'multiple',
        options: baseOptions.map((o) => ({ ...o, description: 'desc' })),
        privacy: 'private',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        maxVotes: 1000,
        allowAnonymous: true,
        requireCaptcha: true,
        category: 'technology',
        tags: ['tag1', 'tag2', 'tag3'],
      }
      const { first, second } = roundTrip(raw)
      expectEquivalent(first, second)
      expect(second.category).toBe('technology')
      expect(second.tags).toEqual(['tag1', 'tag2', 'tag3'])
      expect(second.settings.maxVotes).toBe(1000)
    })

    it('should round-trip a config with all optional fields set', () => {
      const raw: RawPollConfig = {
        title: 'Full Options Poll',
        description: 'A poll with everything',
        type: 'single',
        options: [{ text: 'Yes', description: 'Agree' }, { text: 'No', description: 'Disagree' }],
        privacy: 'unlisted',
        allowAnonymous: true,
        requireCaptcha: true,
        category: 'science',
        tags: ['a'],
      }
      const { first, second } = roundTrip(raw)
      expectEquivalent(first, second)
      expect(second.privacy).toBe('unlisted')
      expect(second.settings.allowAnonymous).toBe(true)
      expect(second.settings.requireCaptcha).toBe(true)
    })
  })
})
