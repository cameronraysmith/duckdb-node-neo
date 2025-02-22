import duckdb, {
  Date_,
  Decimal,
  Interval,
  Time,
  Timestamp,
  TimestampMilliseconds,
  TimestampNanoseconds,
  TimestampSeconds,
  TimeTZ,
} from '@duckdb/node-bindings';
import { expect, suite, test } from 'vitest';
import { expectLogicalType } from './utils/expectLogicalType';
import {
  ARRAY,
  BIGINT,
  BIT,
  BLOB,
  BOOLEAN,
  DATE,
  DECIMAL,
  DOUBLE,
  ENTRY,
  ENUM,
  FLOAT,
  HUGEINT,
  INTEGER,
  INTERVAL,
  LIST,
  SMALLINT,
  STRUCT,
  TIME,
  TIME_TZ,
  TIMESTAMP,
  TIMESTAMP_MS,
  TIMESTAMP_NS,
  TIMESTAMP_S,
  TIMESTAMP_TZ,
  TINYINT,
  UBIGINT,
  UHUGEINT,
  UINTEGER,
  USMALLINT,
  UTINYINT,
  UUID,
  VARCHAR,
  VARINT,
} from './utils/expectedLogicalTypes';

suite('values', () => {
  test('bool', () => {
    const input = true;
    const bool_value = duckdb.create_bool(input);
    expectLogicalType(duckdb.get_value_type(bool_value), BOOLEAN);
    expect(duckdb.get_bool(bool_value)).toBe(input);
  });
  test('int8', () => {
    const input = 127;
    const int8_value = duckdb.create_int8(input);
    expectLogicalType(duckdb.get_value_type(int8_value), TINYINT);
    expect(duckdb.get_int8(int8_value)).toBe(input);
  });
  test('uint8', () => {
    const input = 255;
    const uint8_value = duckdb.create_uint8(input);
    expectLogicalType(duckdb.get_value_type(uint8_value), UTINYINT);
    expect(duckdb.get_uint8(uint8_value)).toBe(input);
  });
  test('int16', () => {
    const input = 32767;
    const int16_value = duckdb.create_int16(input);
    expectLogicalType(duckdb.get_value_type(int16_value), SMALLINT);
    expect(duckdb.get_int16(int16_value)).toBe(input);
  });
  test('uint16', () => {
    const input = 65535;
    const uint16_value = duckdb.create_uint16(input);
    expectLogicalType(duckdb.get_value_type(uint16_value), USMALLINT);
    expect(duckdb.get_uint16(uint16_value)).toBe(input);
  });
  test('int32', () => {
    const input = 2147483647;
    const int32_value = duckdb.create_int32(input);
    expectLogicalType(duckdb.get_value_type(int32_value), INTEGER);
    expect(duckdb.get_int32(int32_value)).toBe(input);
  });
  test('uint32', () => {
    const input = 4294967295;
    const uint32_value = duckdb.create_uint32(input);
    expectLogicalType(duckdb.get_value_type(uint32_value), UINTEGER);
    expect(duckdb.get_uint32(uint32_value)).toBe(input);
  });
  test('int64', () => {
    const input = 9223372036854775807n;
    const int64_value = duckdb.create_int64(input);
    expectLogicalType(duckdb.get_value_type(int64_value), BIGINT);
    expect(duckdb.get_int64(int64_value)).toBe(input);
  });
  test('uint64', () => {
    const input = 18446744073709551615n;
    const uint64_value = duckdb.create_uint64(input);
    expectLogicalType(duckdb.get_value_type(uint64_value), UBIGINT);
    expect(duckdb.get_uint64(uint64_value)).toBe(input);
  });
  test('hugeint', () => {
    const input = 170141183460469231731687303715884105727n;
    const hugeint_value = duckdb.create_hugeint(input);
    expectLogicalType(duckdb.get_value_type(hugeint_value), HUGEINT);
    expect(duckdb.get_hugeint(hugeint_value)).toBe(input);
  });
  test('uhugeint', () => {
    const input = 340282366920938463463374607431768211455n;
    const uhugeint_value = duckdb.create_uhugeint(input);
    expectLogicalType(duckdb.get_value_type(uhugeint_value), UHUGEINT);
    expect(duckdb.get_uhugeint(uhugeint_value)).toBe(input);
  });
  test('varint', () => {
    const input = -(
      ((2n ** 10n + 11n) * 2n ** 64n + (2n ** 9n + 7n)) * 2n ** 64n +
      (2n ** 8n + 5n)
    );
    const varint_value = duckdb.create_varint(input);
    expectLogicalType(duckdb.get_value_type(varint_value), VARINT);
    expect(duckdb.get_varint(varint_value)).toBe(input);
  });
  test('decimal', () => {
    const input: Decimal = { width: 9, scale: 4, value: 987654321n };
    const decimal_value = duckdb.create_decimal(input);
    expectLogicalType(duckdb.get_value_type(decimal_value), DECIMAL(9, 4, duckdb.Type.INTEGER));
    expect(duckdb.get_decimal(decimal_value)).toStrictEqual(input);
  });
  test('float', () => {
    const input = 3.4028234663852886e38;
    const float_value = duckdb.create_float(input);
    expectLogicalType(duckdb.get_value_type(float_value), FLOAT);
    expect(duckdb.get_float(float_value)).toBe(input);
  });
  test('double', () => {
    const input = 1.7976931348623157e308;
    const double_value = duckdb.create_double(input);
    expectLogicalType(duckdb.get_value_type(double_value), DOUBLE);
    expect(duckdb.get_double(double_value)).toBe(input);
  });
  test('date', () => {
    const input: Date_ = { days: 2147483646 };
    const date_value = duckdb.create_date(input);
    expectLogicalType(duckdb.get_value_type(date_value), DATE);
    expect(duckdb.get_date(date_value)).toStrictEqual(input);
  });
  test('time', () => {
    const input: Time = { micros: 86400000000n };
    const time_value = duckdb.create_time(input);
    expectLogicalType(duckdb.get_value_type(time_value), TIME);
    expect(duckdb.get_time(time_value)).toStrictEqual(input);
  });
  test('time_tz', () => {
    const input: TimeTZ = { bits: 1449551462400115198n };
    const time_tz_value = duckdb.create_time_tz_value(input);
    expectLogicalType(duckdb.get_value_type(time_tz_value), TIME_TZ);
    expect(duckdb.get_time_tz(time_tz_value)).toStrictEqual(input);
  });
  test('timestamp', () => {
    const input: Timestamp = { micros: 9223372036854775806n };
    const timestamp_value = duckdb.create_timestamp(input);
    expectLogicalType(duckdb.get_value_type(timestamp_value), TIMESTAMP);
    expect(duckdb.get_timestamp(timestamp_value)).toStrictEqual(input);
  });
  test('timestamp_tz', () => {
    const input: Timestamp = { micros: 9223372036854775806n };
    const timestamp_value = duckdb.create_timestamp_tz(input);
    expectLogicalType(duckdb.get_value_type(timestamp_value), TIMESTAMP_TZ);
    expect(duckdb.get_timestamp_tz(timestamp_value)).toStrictEqual(input);
  });
  test('timestamp_s', () => {
    const input: TimestampSeconds = { seconds: 9223372036854n };
    const timestamp_s_value = duckdb.create_timestamp_s(input);
    expectLogicalType(duckdb.get_value_type(timestamp_s_value), TIMESTAMP_S);
    expect(duckdb.get_timestamp_s(timestamp_s_value)).toStrictEqual(input);
  });
  test('timestamp_ms', () => {
    const input: TimestampMilliseconds = { millis: 9223372036854775n };
    const timestamp_ms_value = duckdb.create_timestamp_ms(input);
    expectLogicalType(duckdb.get_value_type(timestamp_ms_value), TIMESTAMP_MS);
    expect(duckdb.get_timestamp_ms(timestamp_ms_value)).toStrictEqual(input);
  });
  test('timestamp_ns', () => {
    const input: TimestampNanoseconds = { nanos: 9223372036854775806n };
    const timestamp_ns_value = duckdb.create_timestamp_ns(input);
    expectLogicalType(duckdb.get_value_type(timestamp_ns_value), TIMESTAMP_NS);
    expect(duckdb.get_timestamp_ns(timestamp_ns_value)).toStrictEqual(input);
  });
  test('interval', () => {
    const input: Interval = { months: 999, days: 999, micros: 999999999n };
    const interval_value = duckdb.create_interval(input);
    expectLogicalType(duckdb.get_value_type(interval_value), INTERVAL);
    expect(duckdb.get_interval(interval_value)).toStrictEqual(input);
  });
  test('blob', () => {
    const input = Buffer.from('thisisalongblob\x00withnullbytes');
    const blob_value = duckdb.create_blob(input);
    expectLogicalType(duckdb.get_value_type(blob_value), BLOB);
    expect(duckdb.get_blob(blob_value)).toStrictEqual(input);
  });
  test('bit', () => {
    const input = Buffer.from([1, 0b10010001, 0b00101110, 0b00101010, 0b11010111]);
    const bit_value = duckdb.create_bit(input);
    expectLogicalType(duckdb.get_value_type(bit_value), BIT);
    expect(duckdb.get_bit(bit_value)).toStrictEqual(input);
  });
  test('uuid', () => {
    const input = 0xf0e1d2c3b4a596870123456789abcdefn;
    const uuid_value = duckdb.create_uuid(input);
    expectLogicalType(duckdb.get_value_type(uuid_value), UUID);
    expect(duckdb.get_uuid(uuid_value)).toBe(input);
  });
  test('varchar', () => {
    const input = 'varchar_text';
    const varchar_value = duckdb.create_varchar(input);
    expectLogicalType(duckdb.get_value_type(varchar_value), VARCHAR);
    expect(duckdb.get_varchar(varchar_value)).toBe(input);
  });
  test('struct', () => {
    const int_type = duckdb.create_logical_type(duckdb.Type.INTEGER);
    const varchar_type = duckdb.create_logical_type(duckdb.Type.VARCHAR);
    const struct_type = duckdb.create_struct_type([int_type, varchar_type], ['a', 'b']);
    const int32_value = duckdb.create_int32(42);
    const varchar_value = duckdb.create_varchar('duck');
    const struct_value = duckdb.create_struct_value(struct_type, [int32_value, varchar_value]);
    expectLogicalType(
      duckdb.get_value_type(struct_value),
      STRUCT(ENTRY('a', INTEGER), ENTRY('b', VARCHAR))
    );
    const struct_child_0 = duckdb.get_struct_child(struct_value, 0);
    expectLogicalType(duckdb.get_value_type(struct_child_0), INTEGER);
    expect(duckdb.get_int32(struct_child_0)).toBe(42);
    const struct_child_1 = duckdb.get_struct_child(struct_value, 1);
    expectLogicalType(duckdb.get_value_type(struct_child_1), VARCHAR);
    expect(duckdb.get_varchar(struct_child_1)).toBe('duck');
  });
  test('empty struct', () => {
    const struct_type = duckdb.create_struct_type([], []);
    const struct_value = duckdb.create_struct_value(struct_type, []);
    expectLogicalType(duckdb.get_value_type(struct_value), STRUCT());
  });
  test('any struct', () => {
    const any_type = duckdb.create_logical_type(duckdb.Type.ANY);
    const struct_type = duckdb.create_struct_type([any_type], ['a']);
    const int32_value = duckdb.create_int32(42);
    expect(() =>
      duckdb.create_struct_value(struct_type, [int32_value])
    ).toThrowError('Failed to create struct value');
  });
  test('list', () => {
    const int_type = duckdb.create_logical_type(duckdb.Type.INTEGER);
    const int32_value_0 = duckdb.create_int32(42);
    const int32_value_1 = duckdb.create_int32(12345);
    const list_value = duckdb.create_list_value(int_type, [int32_value_0, int32_value_1]);
    expectLogicalType(duckdb.get_value_type(list_value), LIST(INTEGER));
    expect(duckdb.get_list_size(list_value)).toBe(2);
    const list_child_0 = duckdb.get_list_child(list_value, 0);
    expectLogicalType(duckdb.get_value_type(list_child_0), INTEGER);
    expect(duckdb.get_int32(list_child_0)).toBe(42);
    const list_child_1 = duckdb.get_list_child(list_value, 1);
    expectLogicalType(duckdb.get_value_type(list_child_1), INTEGER);
    expect(duckdb.get_int32(list_child_1)).toBe(12345);
  });
  test('empty list', () => {
    const int_type = duckdb.create_logical_type(duckdb.Type.INTEGER);
    const list_value = duckdb.create_list_value(int_type, []);
    expectLogicalType(duckdb.get_value_type(list_value), LIST(INTEGER));
  });
  test('any list', () => {
    const any_type = duckdb.create_logical_type(duckdb.Type.ANY);
    expect(() => duckdb.create_list_value(any_type, [])).toThrowError(
      'Failed to create list value'
    );
  });
  test('array', () => {
    const int_type = duckdb.create_logical_type(duckdb.Type.INTEGER);
    const int32_value = duckdb.create_int32(42);
    const array_value = duckdb.create_array_value(int_type, [int32_value]);
    expectLogicalType(duckdb.get_value_type(array_value), ARRAY(INTEGER, 1));
  });
  test('empty array', () => {
    const int_type = duckdb.create_logical_type(duckdb.Type.INTEGER);
    const array_value = duckdb.create_array_value(int_type, []);
    expectLogicalType(duckdb.get_value_type(array_value), ARRAY(INTEGER, 0));
  });
  test('any array', () => {
    const any_type = duckdb.create_logical_type(duckdb.Type.ANY);
    expect(() => duckdb.create_array_value(any_type, [])).toThrowError(
      'Failed to create array value'
    );
  });
  test('null', () => {
    const null_value = duckdb.create_null_value();
    expect(duckdb.is_null_value(null_value)).toBe(true);
    const int32_value = duckdb.create_int32(42);
    expect(duckdb.is_null_value(int32_value)).toBe(false);
  });
  test('enum', () => {
    const enum_members = ['fly', 'swim', 'walk'];
    const enum_type = duckdb.create_enum_type(enum_members);
    const enum_value = duckdb.create_enum_value(enum_type, 1);
    expectLogicalType(duckdb.get_value_type(enum_value), ENUM(enum_members, duckdb.Type.UTINYINT));
    expect(duckdb.get_enum_value(enum_value)).toBe(1);
  });
});
