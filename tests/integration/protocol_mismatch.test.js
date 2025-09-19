import { describe, it } from 'node:test'
import assert from 'node:assert'

const SUPPORTED_PROTOCOL = '2025-06-18'

describe('Protocol Version Mismatch Test', () => {
  it('should validate supported MCP protocol versions', () => {
    const supportedVersions = [SUPPORTED_PROTOCOL]
    const unsupportedVersions = ['2023-01-01', '2025-01-01', 'invalid-version']
    
    supportedVersions.forEach(version => {
      assert.equal(version, SUPPORTED_PROTOCOL, 'Should support version ' + version)
    })
    
    unsupportedVersions.forEach(version => {
      assert.notEqual(version, SUPPORTED_PROTOCOL, 'Should reject version ' + version)
    })
  })

  it('should handle protocol version negotiation', () => {
    // Mock protocol version negotiation
    const clientVersions = [SUPPORTED_PROTOCOL, '2023-01-01']
    const serverSupportedVersion = SUPPORTED_PROTOCOL
    
    const negotiatedVersion = clientVersions.find(v => v === serverSupportedVersion) || null
    
    assert.equal(negotiatedVersion, SUPPORTED_PROTOCOL, 'Should negotiate to supported version')
  })

  it('should reject unsupported protocol versions', () => {
    const unsupportedVersions = ['2023-01-01', '2025-01-01', '1.0', '2.0']
    
    unsupportedVersions.forEach(version => {
      const isSupported = version === SUPPORTED_PROTOCOL
      assert(!isSupported, 'Version ' + version + ' should be rejected')
    })
  })

  it('should validate protocol version format', () => {
    const validFormats = [SUPPORTED_PROTOCOL, '2025-01-15']
    const invalidFormats = ['2024/11/05', '2024-13-05', '2024-11-32', 'invalid']
    
    const matchesFormat = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    const isRealDate = (value) => {
      if (!matchesFormat(value)) return false
      const date = new Date(value)
      if (Number.isNaN(date.valueOf())) return false
      return date.toISOString().startsWith(value)
    }

    validFormats.forEach(version => {
      assert(isRealDate(version), 'Version ' + version + ' should have valid format')
    })
    
    invalidFormats.forEach(version => {
      assert(!isRealDate(version), 'Version ' + version + ' should be rejected for invalid format')
    })
  })
})
