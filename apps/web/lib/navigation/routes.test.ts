import { describe, expect, it } from 'vitest';
import {
  DATASET_ID_MAX_VISIBLE,
  datasetBiopilaPath,
  datasetDashboardPath,
  truncateDatasetId,
} from './routes';

describe('datasetDashboardPath', () => {
  it('builds canonical dashboard path', () => {
    expect(datasetDashboardPath('ds-1')).toBe('/datasets/ds-1/dashboard');
  });

  it('encodes special characters in dataset id', () => {
    expect(datasetDashboardPath('a/b')).toBe('/datasets/a%2Fb/dashboard');
  });
});

describe('datasetBiopilaPath', () => {
  it('builds canonical biopila path', () => {
    expect(datasetBiopilaPath('ds-1', 'B1')).toBe(
      '/datasets/ds-1/biopila/B1'
    );
  });
});

describe('truncateDatasetId', () => {
  it('returns short ids unchanged', () => {
    expect(truncateDatasetId('short')).toBe('short');
  });

  it('truncates long ids with ellipsis', () => {
    const long = 'a'.repeat(DATASET_ID_MAX_VISIBLE + 5);
    expect(truncateDatasetId(long)).toBe(
      `${'a'.repeat(DATASET_ID_MAX_VISIBLE)}…`
    );
  });

  it('respects custom max length', () => {
    expect(truncateDatasetId('abcdefgh', 4)).toBe('abcd…');
  });
});
