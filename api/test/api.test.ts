import { assert, describe, test } from 'vitest';
import {
  DuckDBAnyType,
  DuckDBArrayType,
  DuckDBArrayVector,
  DuckDBBigIntType,
  DuckDBBigIntVector,
  DuckDBBitType,
  DuckDBBitVector,
  DuckDBBlobType,
  DuckDBBlobValue,
  DuckDBBlobVector,
  DuckDBBooleanType,
  DuckDBBooleanVector,
  DuckDBConnection,
  DuckDBDataChunk,
  DuckDBDateType,
  DuckDBDateValue,
  DuckDBDateVector,
  DuckDBDecimal16Vector,
  DuckDBDecimal2Vector,
  DuckDBDecimal4Vector,
  DuckDBDecimal8Vector,
  DuckDBDecimalType,
  DuckDBDoubleType,
  DuckDBDoubleVector,
  DuckDBEnum1Vector,
  DuckDBEnum2Vector,
  DuckDBEnum4Vector,
  DuckDBEnumType,
  DuckDBFloatType,
  DuckDBFloatVector,
  DuckDBHugeIntType,
  DuckDBHugeIntVector,
  DuckDBInstance,
  DuckDBIntegerType,
  DuckDBIntegerVector,
  DuckDBIntervalType,
  DuckDBIntervalVector,
  DuckDBListType,
  DuckDBListVector,
  DuckDBMapType,
  DuckDBMapVector,
  DuckDBPendingResultState,
  DuckDBResult,
  DuckDBSQLNullType,
  DuckDBSmallIntType,
  DuckDBSmallIntVector,
  DuckDBStructType,
  DuckDBStructVector,
  DuckDBTimeTZType,
  DuckDBTimeTZValue,
  DuckDBTimeTZVector,
  DuckDBTimeType,
  DuckDBTimeValue,
  DuckDBTimeVector,
  DuckDBTimestampMillisecondsType,
  DuckDBTimestampMillisecondsValue,
  DuckDBTimestampMillisecondsVector,
  DuckDBTimestampNanosecondsType,
  DuckDBTimestampNanosecondsValue,
  DuckDBTimestampNanosecondsVector,
  DuckDBTimestampSecondsType,
  DuckDBTimestampSecondsValue,
  DuckDBTimestampSecondsVector,
  DuckDBTimestampTZType,
  DuckDBTimestampTZValue,
  DuckDBTimestampTZVector,
  DuckDBTimestampType,
  DuckDBTimestampValue,
  DuckDBTimestampVector,
  DuckDBTinyIntType,
  DuckDBTinyIntVector,
  DuckDBType,
  DuckDBTypeId,
  DuckDBUBigIntType,
  DuckDBUBigIntVector,
  DuckDBUHugeIntType,
  DuckDBUHugeIntVector,
  DuckDBUIntegerType,
  DuckDBUIntegerVector,
  DuckDBUSmallIntType,
  DuckDBUSmallIntVector,
  DuckDBUTinyIntType,
  DuckDBUTinyIntVector,
  DuckDBUUIDType,
  DuckDBUUIDValue,
  DuckDBUUIDVector,
  DuckDBUnionType,
  DuckDBUnionVector,
  DuckDBValue,
  DuckDBVarCharType,
  DuckDBVarCharVector,
  DuckDBVarIntType,
  DuckDBVarIntVector,
  DuckDBVector,
  ResultReturnType,
  StatementType,
  arrayValue,
  bitValue,
  configurationOptionDescriptions,
  dateValue,
  decimalBigint,
  decimalNumber,
  intervalValue,
  listValue,
  mapValue,
  structValue,
  timestampTZValue,
  timestampValue,
  unionValue,
  version
} from '../src';

const BI_10_8 = 100000000n;
const BI_10_10 = 10000000000n;
const BI_18_9s = BI_10_8 * BI_10_10 - 1n;
const BI_38_9s = BI_10_8 * BI_10_10 * BI_10_10 * BI_10_10 - 1n;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function withConnection(fn: (connection: DuckDBConnection) => Promise<void>) {
  const instance = await DuckDBInstance.create();
  try {
    const connection = await instance.connect();
    try {
      await fn(connection);
    } finally {
      connection.dispose();
    }
  } finally {
    instance.dispose();
  }
}

interface ExpectedColumn {
  readonly name: string;
  readonly type: DuckDBType;
}

function assertColumns(result: DuckDBResult, expectedColumns: readonly ExpectedColumn[]) {
  assert.strictEqual(result.columnCount, expectedColumns.length, 'column count');
  for (let i = 0; i < expectedColumns.length; i++) {
    const { name, type } = expectedColumns[i];
    assert.strictEqual(result.columnName(i), name, 'column name');
    assert.strictEqual(result.columnTypeId(i), type.typeId, `column type id (column: ${name})`);
    assert.deepStrictEqual(result.columnType(i), type, `column type (column: ${name})`);
  }
}

function isVectorType<TValue extends DuckDBValue, TVector extends DuckDBVector<TValue>>(
  vector: DuckDBVector<any> | null,
  vectorType: new (...args: any[]) => TVector,
): vector is TVector {
  return vector instanceof vectorType;
}

function getColumnVector<TValue extends DuckDBValue, TVector extends DuckDBVector<TValue>>(
  chunk: DuckDBDataChunk,
  columnIndex: number,
  vectorType: new (...args: any[]) => TVector
): TVector {
  const column = chunk.getColumn(columnIndex);
  if (!isVectorType<TValue, TVector>(column, vectorType)) {
    assert.fail(`expected column ${columnIndex} to be a ${vectorType}`);
  }
  return column;
}

function assertVectorValues<TValue extends DuckDBValue>(
  vector: DuckDBVector<TValue> | null | undefined,
  values: readonly TValue[],
  vectorName: string,
) {
  if (!vector) {
    assert.fail(`${vectorName} unexpectedly null or undefined`);
  }
  assert.strictEqual(vector.itemCount, values.length,
      `expected vector ${vectorName} item count to be ${values.length} but found ${vector.itemCount}`);
  for (let i = 0; i < values.length; i++) {
    const actual: TValue | null = vector.getItem(i);
    const expected = values[i];
    assert.deepStrictEqual(actual, expected,
      `expected vector ${vectorName}[${i}] to be ${expected} but found ${actual}`);
  }
}

function assertValues<TValue extends DuckDBValue, TVector extends DuckDBVector<TValue>>(
  chunk: DuckDBDataChunk,
  columnIndex: number,
  vectorType: new (...args: any[]) => TVector,
  values: readonly (TValue | null)[],
) {
  const vector = getColumnVector(chunk, columnIndex, vectorType);
  assertVectorValues(vector, values, `${columnIndex}`);
}

function bigints(start: bigint, end: bigint) {
  return Array.from({ length: Number(end - start) + 1 }).map((_, i) => start + BigInt(i));
}

describe('api', () => {
  test('should expose version', () => {
    const ver = version();
    assert.ok(ver.startsWith('v'), `version starts with 'v'`);
  });
  test('should expose configuration option descriptions', () => {
    const descriptions = configurationOptionDescriptions();
    assert.ok(descriptions['memory_limit'], `descriptions has 'memory_limit'`);
  });
  test('ReturnResultType enum', () => {
    assert.equal(ResultReturnType.INVALID, 0);
    assert.equal(ResultReturnType.CHANGED_ROWS, 1);
    assert.equal(ResultReturnType.NOTHING, 2);
    assert.equal(ResultReturnType.QUERY_RESULT, 3);

    assert.equal(ResultReturnType[ResultReturnType.INVALID], 'INVALID');
    assert.equal(ResultReturnType[ResultReturnType.CHANGED_ROWS], 'CHANGED_ROWS');
    assert.equal(ResultReturnType[ResultReturnType.NOTHING], 'NOTHING');
    assert.equal(ResultReturnType[ResultReturnType.QUERY_RESULT], 'QUERY_RESULT');
  });
  test('StatementType enum', () => {
    assert.equal(StatementType.INVALID, 0);
    assert.equal(StatementType.SELECT, 1);
    assert.equal(StatementType.INSERT, 2);
    assert.equal(StatementType.UPDATE, 3);
    assert.equal(StatementType.EXPLAIN, 4);
    assert.equal(StatementType.DELETE, 5);
    assert.equal(StatementType.PREPARE, 6);
    assert.equal(StatementType.CREATE, 7);
    assert.equal(StatementType.EXECUTE, 8);
    assert.equal(StatementType.ALTER, 9);
    assert.equal(StatementType.TRANSACTION, 10);
    assert.equal(StatementType.COPY, 11);
    assert.equal(StatementType.ANALYZE, 12);
    assert.equal(StatementType.VARIABLE_SET, 13);
    assert.equal(StatementType.CREATE_FUNC, 14);
    assert.equal(StatementType.DROP, 15);
    assert.equal(StatementType.EXPORT, 16);
    assert.equal(StatementType.PRAGMA, 17);
    assert.equal(StatementType.VACUUM, 18);
    assert.equal(StatementType.CALL, 19);
    assert.equal(StatementType.SET, 20);
    assert.equal(StatementType.LOAD, 21);
    assert.equal(StatementType.RELATION, 22);
    assert.equal(StatementType.EXTENSION, 23);
    assert.equal(StatementType.LOGICAL_PLAN, 24);
    assert.equal(StatementType.ATTACH, 25);
    assert.equal(StatementType.DETACH, 26);
    assert.equal(StatementType.MULTI, 27);

    assert.equal(StatementType[StatementType.INVALID], 'INVALID');
    assert.equal(StatementType[StatementType.SELECT], 'SELECT');
    assert.equal(StatementType[StatementType.INSERT], 'INSERT');
    assert.equal(StatementType[StatementType.UPDATE], 'UPDATE');
    assert.equal(StatementType[StatementType.EXPLAIN], 'EXPLAIN');
    assert.equal(StatementType[StatementType.DELETE], 'DELETE');
    assert.equal(StatementType[StatementType.PREPARE], 'PREPARE');
    assert.equal(StatementType[StatementType.CREATE], 'CREATE');
    assert.equal(StatementType[StatementType.EXECUTE], 'EXECUTE');
    assert.equal(StatementType[StatementType.ALTER], 'ALTER');
    assert.equal(StatementType[StatementType.TRANSACTION], 'TRANSACTION');
    assert.equal(StatementType[StatementType.COPY], 'COPY');
    assert.equal(StatementType[StatementType.ANALYZE], 'ANALYZE');
    assert.equal(StatementType[StatementType.VARIABLE_SET], 'VARIABLE_SET');
    assert.equal(StatementType[StatementType.CREATE_FUNC], 'CREATE_FUNC');
    assert.equal(StatementType[StatementType.DROP], 'DROP');
    assert.equal(StatementType[StatementType.EXPORT], 'EXPORT');
    assert.equal(StatementType[StatementType.PRAGMA], 'PRAGMA');
    assert.equal(StatementType[StatementType.VACUUM], 'VACUUM');
    assert.equal(StatementType[StatementType.CALL], 'CALL');
    assert.equal(StatementType[StatementType.SET], 'SET');
    assert.equal(StatementType[StatementType.LOAD], 'LOAD');
    assert.equal(StatementType[StatementType.RELATION], 'RELATION');
    assert.equal(StatementType[StatementType.EXTENSION], 'EXTENSION');
    assert.equal(StatementType[StatementType.LOGICAL_PLAN], 'LOGICAL_PLAN');
    assert.equal(StatementType[StatementType.ATTACH], 'ATTACH');
    assert.equal(StatementType[StatementType.DETACH], 'DETACH');
    assert.equal(StatementType[StatementType.MULTI], 'MULTI');
  });
  test('DuckDBType toString', () => {
    assert.equal(DuckDBBooleanType.instance.toString(), 'BOOLEAN');
    assert.equal(DuckDBTinyIntType.instance.toString(), 'TINYINT');
    assert.equal(DuckDBSmallIntType.instance.toString(), 'SMALLINT');
    assert.equal(DuckDBIntegerType.instance.toString(), 'INTEGER');
    assert.equal(DuckDBBigIntType.instance.toString(), 'BIGINT');
    assert.equal(DuckDBUTinyIntType.instance.toString(), 'UTINYINT');
    assert.equal(DuckDBUSmallIntType.instance.toString(), 'USMALLINT');
    assert.equal(DuckDBUIntegerType.instance.toString(), 'UINTEGER');
    assert.equal(DuckDBUBigIntType.instance.toString(), 'UBIGINT');
    assert.equal(DuckDBFloatType.instance.toString(), 'FLOAT');
    assert.equal(DuckDBDoubleType.instance.toString(), 'DOUBLE');
    assert.equal(DuckDBTimestampType.instance.toString(), 'TIMESTAMP');
    assert.equal(DuckDBDateType.instance.toString(), 'DATE');
    assert.equal(DuckDBTimeType.instance.toString(), 'TIME');
    assert.equal(DuckDBIntervalType.instance.toString(), 'INTERVAL');
    assert.equal(DuckDBHugeIntType.instance.toString(), 'HUGEINT');
    assert.equal(DuckDBUHugeIntType.instance.toString(), 'UHUGEINT');
    assert.equal(DuckDBVarCharType.instance.toString(), 'VARCHAR');
    assert.equal(DuckDBBlobType.instance.toString(), 'BLOB');
    assert.equal((new DuckDBDecimalType(17, 5)).toString(), 'DECIMAL(17,5)');
    assert.equal(DuckDBTimestampSecondsType.instance.toString(), 'TIMESTAMP_S');
    assert.equal(DuckDBTimestampMillisecondsType.instance.toString(), 'TIMESTAMP_MS');
    assert.equal(DuckDBTimestampNanosecondsType.instance.toString(), 'TIMESTAMP_NS');
    assert.equal(
      (new DuckDBEnumType(['fly', 'swim', 'walk'], DuckDBTypeId.UTINYINT)).toString(),
      `ENUM('fly', 'swim', 'walk')`
    );
    assert.equal((new DuckDBListType(DuckDBIntegerType.instance)).toString(), 'INTEGER[]');
    assert.equal((new DuckDBStructType([
      { name: 'id', valueType: DuckDBVarCharType.instance },
      { name: 'ts', valueType: DuckDBTimestampType.instance },
    ])).toString(), 'STRUCT("id" VARCHAR, "ts" TIMESTAMP)');
    assert.equal(
      (new DuckDBMapType(DuckDBIntegerType.instance, DuckDBVarCharType.instance)).toString(),
      'MAP(INTEGER, VARCHAR)'
    );
    assert.equal((new DuckDBArrayType(DuckDBIntegerType.instance, 3)).toString(), 'INTEGER[3]');
    assert.equal(DuckDBUUIDType.instance.toString(), 'UUID');
    assert.equal((new DuckDBUnionType([
      { tag: 'str', valueType: DuckDBVarCharType.instance },
      { tag: 'num', valueType: DuckDBIntegerType.instance },
    ])).toString(), 'UNION("str" VARCHAR, "num" INTEGER)');
    assert.equal(DuckDBBitType.instance.toString(), 'BIT');
    assert.equal(DuckDBTimeTZType.instance.toString(), 'TIME WITH TIME ZONE');
    assert.equal(DuckDBTimestampTZType.instance.toString(), 'TIMESTAMP WITH TIME ZONE');
    assert.equal(DuckDBAnyType.instance.toString(), 'ANY');
    assert.equal(DuckDBVarIntType.instance.toString(), 'VARINT');
    assert.equal(DuckDBSQLNullType.instance.toString(), 'SQLNULL');
  });
  test('should support creating, connecting, running a basic query, and reading results', async () => {
    const instance = await DuckDBInstance.create();
    const connection = await instance.connect();
    const result = await connection.run('select 42 as num');
    try {
      assertColumns(result, [{ name: 'num', type: DuckDBIntegerType.instance }]);
      const chunk = await result.fetchChunk();
      try {
        assert.strictEqual(chunk.columnCount, 1);
        assert.strictEqual(chunk.rowCount, 1);
        assertValues<number, DuckDBIntegerVector>(chunk, 0, DuckDBIntegerVector, [42]);
      } finally {
        chunk.dispose();
      }
    } finally {
      result.dispose();
      connection.dispose();
      instance.dispose();
    }
  });
  test('should support running prepared statements', async () => {
    await withConnection(async (connection) => {
      const prepared = await connection.prepare('select $num as a, $str as b, $bool as c, $null as d');
      try {
        assert.strictEqual(prepared.parameterCount, 4);
        assert.strictEqual(prepared.parameterName(1), 'num');
        assert.strictEqual(prepared.parameterName(2), 'str');
        assert.strictEqual(prepared.parameterName(3), 'bool');
        assert.strictEqual(prepared.parameterName(4), 'null');
        prepared.bindInteger(1, 10);
        prepared.bindVarchar(2, 'abc');
        prepared.bindBoolean(3, true);
        prepared.bindNull(4);
        const result = await prepared.run();
        try {
          assertColumns(result, [
            { name: 'a', type: DuckDBIntegerType.instance },
            { name: 'b', type: DuckDBVarCharType.instance },
            { name: 'c', type: DuckDBBooleanType.instance },
            { name: 'd', type: DuckDBIntegerType.instance },
          ]);
          const chunk = await result.fetchChunk();
          try {
            assert.strictEqual(chunk.columnCount, 4);
            assert.strictEqual(chunk.rowCount, 1);
            assertValues<number, DuckDBIntegerVector>(chunk, 0, DuckDBIntegerVector, [10]);
            assertValues<string, DuckDBVarCharVector>(chunk, 1, DuckDBVarCharVector, ['abc']);
            assertValues<boolean, DuckDBBooleanVector>(chunk, 2, DuckDBBooleanVector, [true]);
            assertValues<number, DuckDBIntegerVector>(chunk, 3, DuckDBIntegerVector, [null]);
          } finally {
            chunk.dispose();
          }
        } finally {
          result.dispose();
        }
      } finally {
        prepared.dispose();
      }
    });
  });
  test('should support starting prepared statements and running them incrementally', async () => {
    await withConnection(async (connection) => {
      const prepared = await connection.prepare('select int from test_all_types()');
      try {
        const pending = prepared.start();
        try {
          let taskCount = 0;
          while (pending.runTask() !== DuckDBPendingResultState.RESULT_READY) {
            taskCount++;
            if (taskCount > 100) { // arbitrary upper bound on the number of tasks expected for this simple query
              assert.fail('Unexpectedly large number of tasks');
            }
            await sleep(1);
          }
          // console.debug('task count: ', taskCount);
          const result = await pending.getResult();
          try {
            assertColumns(result, [
              { name: 'int', type: DuckDBIntegerType.instance },
            ]);
            const chunk = await result.fetchChunk();
            try {
              assert.strictEqual(chunk.columnCount, 1);
              assert.strictEqual(chunk.rowCount, 3);
              assertValues(chunk, 0, DuckDBIntegerVector, [DuckDBIntegerType.Min, DuckDBIntegerType.Max, null]);
            } finally {
              chunk.dispose();
            }
          } finally {
            result.dispose();
          }
        } finally {
          pending.dispose();
        }
      } finally {
        prepared.dispose();
      }
    });
  });
  test('should support streaming results from prepared statements', async () => {
    await withConnection(async (connection) => {
      const prepared = await connection.prepare('from range(10000)');
      try {
        const pending = prepared.start();
        try {
          const result = await pending.getResult();
          try {
            assertColumns(result, [
              { name: 'range', type: DuckDBBigIntType.instance },
            ]);
            const chunks: DuckDBDataChunk[] = [];
            let currentChunk: DuckDBDataChunk | null = null;
            try {
              currentChunk = await result.fetchChunk();
              while (currentChunk.rowCount > 0) {
                chunks.push(currentChunk);
                currentChunk = await result.fetchChunk();
              }
              currentChunk.dispose(); // this is the empty chunk that signifies the end of the stream
              currentChunk = null;
              assert.strictEqual(chunks.length, 5); // ceil(10000 / 2048) = 5
              assertValues(chunks[0], 0, DuckDBBigIntVector, bigints(0n, 2048n - 1n));
              assertValues(chunks[1], 0, DuckDBBigIntVector, bigints(2048n, 2048n * 2n - 1n));
              assertValues(chunks[2], 0, DuckDBBigIntVector, bigints(2048n * 2n, 2048n * 3n - 1n));
              assertValues(chunks[3], 0, DuckDBBigIntVector, bigints(2048n * 3n, 2048n * 4n - 1n));
              assertValues(chunks[4], 0, DuckDBBigIntVector, bigints(2048n * 4n, 9999n));
            } finally {
              if (currentChunk) {
                currentChunk.dispose();
              }
              for (const chunk of chunks) {
                chunk.dispose();
              }
            }
          } finally {
            result.dispose();
          }
        } finally {
          pending.dispose();
        }
      } finally {
        prepared.dispose();
      }
    });
  });
  test('should support all data types', async () => {
    await withConnection(async (connection) => {
      const result = await connection.run('from test_all_types(use_large_enum=true)');
      try {
        const smallEnumValues = ['DUCK_DUCK_ENUM', 'GOOSE'];
        const mediumEnumValues = Array.from({ length: 300 }).map((_, i) => `enum_${i}`);
        const largeEnumValues = Array.from({ length: 70000 }).map((_, i) => `enum_${i}`);
        assertColumns(result, [
          { name: 'bool', type: DuckDBBooleanType.instance },
          { name: 'tinyint', type: DuckDBTinyIntType.instance },
          { name: 'smallint', type: DuckDBSmallIntType.instance },
          { name: 'int', type: DuckDBIntegerType.instance },
          { name: 'bigint', type: DuckDBBigIntType.instance },
          { name: 'hugeint', type: DuckDBHugeIntType.instance },
          { name: 'uhugeint', type: DuckDBUHugeIntType.instance },
          { name: 'utinyint', type: DuckDBUTinyIntType.instance },
          { name: 'usmallint', type: DuckDBUSmallIntType.instance },
          { name: 'uint', type: DuckDBUIntegerType.instance },
          { name: 'ubigint', type: DuckDBUBigIntType.instance },
          { name: 'varint', type: DuckDBVarIntType.instance },
          { name: 'date', type: DuckDBDateType.instance },
          { name: 'time', type: DuckDBTimeType.instance },
          { name: 'timestamp', type: DuckDBTimestampType.instance },
          { name: 'timestamp_s', type: DuckDBTimestampSecondsType.instance },
          { name: 'timestamp_ms', type: DuckDBTimestampMillisecondsType.instance },
          { name: 'timestamp_ns', type: DuckDBTimestampNanosecondsType.instance },
          { name: 'time_tz', type: DuckDBTimeTZType.instance },
          { name: 'timestamp_tz', type: DuckDBTimestampTZType.instance },
          { name: 'float', type: DuckDBFloatType.instance },
          { name: 'double', type: DuckDBDoubleType.instance },
          { name: 'dec_4_1', type: new DuckDBDecimalType(4, 1) },
          { name: 'dec_9_4', type: new DuckDBDecimalType(9, 4) },
          { name: 'dec_18_6', type: new DuckDBDecimalType(18, 6) },
          { name: 'dec38_10', type: new DuckDBDecimalType(38, 10) },
          { name: 'uuid', type: DuckDBUUIDType.instance },
          { name: 'interval', type: DuckDBIntervalType.instance },
          { name: 'varchar', type: DuckDBVarCharType.instance },
          { name: 'blob', type: DuckDBBlobType.instance },
          { name: 'bit', type: DuckDBBitType.instance },
          { name: 'small_enum', type: new DuckDBEnumType(smallEnumValues, DuckDBTypeId.UTINYINT) },
          { name: 'medium_enum', type: new DuckDBEnumType(mediumEnumValues, DuckDBTypeId.USMALLINT) },
          { name: 'large_enum', type: new DuckDBEnumType(largeEnumValues, DuckDBTypeId.UINTEGER) },
          { name: 'int_array', type: new DuckDBListType(DuckDBIntegerType.instance) },
          { name: 'double_array', type: new DuckDBListType(DuckDBDoubleType.instance) },
          { name: 'date_array', type: new DuckDBListType(DuckDBDateType.instance) },
          { name: 'timestamp_array', type: new DuckDBListType(DuckDBTimestampType.instance) },
          { name: 'timestamptz_array', type: new DuckDBListType(DuckDBTimestampTZType.instance) },
          { name: 'varchar_array', type: new DuckDBListType(DuckDBVarCharType.instance) },
          { name: 'nested_int_array', type: new DuckDBListType(new DuckDBListType(DuckDBIntegerType.instance)) },
          { name: 'struct', type: new DuckDBStructType([
            { name: 'a', valueType: DuckDBIntegerType.instance },
            { name: 'b', valueType: DuckDBVarCharType.instance },
          ]) },
          { name: 'struct_of_arrays', type: new DuckDBStructType([
            { name: 'a', valueType: new DuckDBListType(DuckDBIntegerType.instance) },
            { name: 'b', valueType: new DuckDBListType(DuckDBVarCharType.instance) },
          ])},
          { name: 'array_of_structs', type: new DuckDBListType(new DuckDBStructType([
            { name: 'a', valueType: DuckDBIntegerType.instance },
            { name: 'b', valueType: DuckDBVarCharType.instance },
          ]))},
          { name: 'map', type: new DuckDBMapType(DuckDBVarCharType.instance, DuckDBVarCharType.instance) },
          { name: 'union', type: new DuckDBUnionType([
            { tag: 'name', valueType: DuckDBVarCharType.instance },
            { tag: 'age', valueType: DuckDBSmallIntType.instance },
          ])},
          { name: 'fixed_int_array', type: new DuckDBArrayType(DuckDBIntegerType.instance, 3) },
          { name: 'fixed_varchar_array', type: new DuckDBArrayType(DuckDBVarCharType.instance, 3) },
          { name: 'fixed_nested_int_array', type: new DuckDBArrayType(new DuckDBArrayType(DuckDBIntegerType.instance, 3), 3) },
          { name: 'fixed_nested_varchar_array', type: new DuckDBArrayType(new DuckDBArrayType(DuckDBVarCharType.instance, 3), 3) },
          { name: 'fixed_struct_array', type: new DuckDBArrayType(new DuckDBStructType([
            { name: 'a', valueType: DuckDBIntegerType.instance },
            { name: 'b', valueType: DuckDBVarCharType.instance },
          ]), 3) },
          { name: 'struct_of_fixed_array', type: new DuckDBStructType([
            { name: 'a', valueType: new DuckDBArrayType(DuckDBIntegerType.instance, 3) },
            { name: 'b', valueType: new DuckDBArrayType(DuckDBVarCharType.instance, 3) },
          ]) },
          { name: 'fixed_array_of_int_list', type: new DuckDBArrayType(new DuckDBListType(DuckDBIntegerType.instance), 3) },
          { name: 'list_of_fixed_int_array', type: new DuckDBListType(new DuckDBArrayType(DuckDBIntegerType.instance, 3)) },
        ]);

        const chunk = await result.fetchChunk();
        try {
          assert.strictEqual(chunk.columnCount, 54);
          assert.strictEqual(chunk.rowCount, 3);

          assertValues(chunk, 0, DuckDBBooleanVector, [false, true, null]);
          assertValues(chunk, 1, DuckDBTinyIntVector, [DuckDBTinyIntType.Min, DuckDBTinyIntType.Max, null]);
          assertValues(chunk, 2, DuckDBSmallIntVector, [DuckDBSmallIntType.Min, DuckDBSmallIntType.Max, null]);
          assertValues(chunk, 3, DuckDBIntegerVector, [DuckDBIntegerType.Min, DuckDBIntegerType.Max, null]);
          assertValues(chunk, 4, DuckDBBigIntVector, [DuckDBBigIntType.Min, DuckDBBigIntType.Max, null]);
          assertValues(chunk, 5, DuckDBHugeIntVector, [DuckDBHugeIntType.Min, DuckDBHugeIntType.Max, null]);
          assertValues(chunk, 6, DuckDBUHugeIntVector, [DuckDBUHugeIntType.Min, DuckDBUHugeIntType.Max, null]);
          assertValues(chunk, 7, DuckDBUTinyIntVector, [DuckDBUTinyIntType.Min, DuckDBUTinyIntType.Max, null]);
          assertValues(chunk, 8, DuckDBUSmallIntVector, [DuckDBUSmallIntType.Min, DuckDBUSmallIntType.Max, null]);
          assertValues(chunk, 9, DuckDBUIntegerVector, [DuckDBUIntegerType.Min, DuckDBUIntegerType.Max, null]);
          assertValues(chunk, 10, DuckDBUBigIntVector, [DuckDBUBigIntType.Min, DuckDBUBigIntType.Max, null]);
          assertValues(chunk, 11, DuckDBVarIntVector, [DuckDBVarIntType.Min, DuckDBVarIntType.Max, null]);
          assertValues(chunk, 12, DuckDBDateVector, [DuckDBDateValue.Min, DuckDBDateValue.Max, null]);
          assertValues(chunk, 13, DuckDBTimeVector, [DuckDBTimeValue.Min, DuckDBTimeValue.Max, null]);
          assertValues(chunk, 14, DuckDBTimestampVector,
            [DuckDBTimestampValue.Min, DuckDBTimestampValue.Max, null]);
          assertValues(chunk, 15, DuckDBTimestampSecondsVector,
            [DuckDBTimestampSecondsValue.Min, DuckDBTimestampSecondsValue.Max, null]);
          assertValues(chunk, 16, DuckDBTimestampMillisecondsVector,
            [DuckDBTimestampMillisecondsValue.Min, DuckDBTimestampMillisecondsValue.Max, null]);
          assertValues(chunk, 17, DuckDBTimestampNanosecondsVector,
            [DuckDBTimestampNanosecondsValue.Min, DuckDBTimestampNanosecondsValue.Max, null]);
          assertValues(chunk, 18, DuckDBTimeTZVector, [DuckDBTimeTZValue.Min, DuckDBTimeTZValue.Max, null]);
          assertValues(chunk, 19, DuckDBTimestampTZVector,
            [DuckDBTimestampTZValue.Min, DuckDBTimestampTZValue.Max, null]);
          assertValues(chunk, 20, DuckDBFloatVector, [DuckDBFloatType.Min, DuckDBFloatType.Max, null]);
          assertValues(chunk, 21, DuckDBDoubleVector, [DuckDBDoubleType.Min, DuckDBDoubleType.Max, null]);
          assertValues(chunk, 22, DuckDBDecimal2Vector, [
            decimalNumber(4, 1, -9999),
            decimalNumber(4, 1, 9999 as number),
            null,
          ]);
          assertValues(chunk, 23, DuckDBDecimal4Vector, [
            decimalNumber(9, 4, -999999999),
            decimalNumber(9, 4, 999999999),
            null,
          ]);
          assertValues(chunk, 24, DuckDBDecimal8Vector, [
            decimalBigint(18, 6, -BI_18_9s),
            decimalBigint(18, 6, BI_18_9s),
            null,
          ]);
          assertValues(chunk, 25, DuckDBDecimal16Vector, [
            decimalBigint(38, 10, -BI_38_9s),
            decimalBigint(38, 10, BI_38_9s),
            null,
          ]);
          assertValues(chunk, 26, DuckDBUUIDVector, [DuckDBUUIDValue.Min, DuckDBUUIDValue.Max, null]);
          assertValues(chunk, 27, DuckDBIntervalVector, [
            intervalValue(0, 0, 0n),
            intervalValue(999, 999, 999999999n),
            null,
          ]);
          assertValues<string, DuckDBVarCharVector>(chunk, 28, DuckDBVarCharVector, ['🦆🦆🦆🦆🦆🦆', 'goo\0se', null]);
          assertValues(chunk, 29, DuckDBBlobVector, [
            DuckDBBlobValue.fromString('thisisalongblob\x00withnullbytes'),
            DuckDBBlobValue.fromString('\x00\x00\x00a'),
            null,
          ]);
          assertValues(chunk, 30, DuckDBBitVector, [
            bitValue('0010001001011100010101011010111'),
            bitValue('10101'),
            null,
          ]);
          assertValues(chunk, 31, DuckDBEnum1Vector, [
            smallEnumValues[0],
            smallEnumValues[smallEnumValues.length - 1],
            null,
          ]);
          assertValues(chunk, 32, DuckDBEnum2Vector, [
            mediumEnumValues[0],
            mediumEnumValues[mediumEnumValues.length - 1],
            null,
          ]);
          assertValues(chunk, 33, DuckDBEnum4Vector, [
            largeEnumValues[0],
            largeEnumValues[largeEnumValues.length - 1],
            null,
          ]);
          // int_array
          assertValues(chunk, 34, DuckDBListVector, [
            listValue([]),
            listValue([42, 999, null, null, -42]),
            null,
          ]);
          // double_array
          assertValues(chunk, 35, DuckDBListVector, [
            listValue([]),
            listValue([42.0, NaN, Infinity, -Infinity, null, -42.0]),
            null,
          ]);
          // date_array
          assertValues(chunk, 36, DuckDBListVector, [
            listValue([]),
            listValue([dateValue(0), DuckDBDateValue.PosInf, DuckDBDateValue.NegInf, null, dateValue(19124)]),
            null,
          ]);
          // timestamp_array
          assertValues(chunk, 37, DuckDBListVector, [
            listValue([]),
            listValue([
              DuckDBTimestampValue.Epoch,
              DuckDBTimestampValue.PosInf,
              DuckDBTimestampValue.NegInf,
              null,
              // 1652372625 is 2022-05-12 16:23:45
              timestampValue(1652372625n * 1000n * 1000n),
            ]),
            null,
          ]);
          // timestamptz_array
          assertValues(chunk, 38, DuckDBListVector, [
            listValue([]),
            listValue([
              DuckDBTimestampTZValue.Epoch,
              DuckDBTimestampTZValue.PosInf,
              DuckDBTimestampTZValue.NegInf,
              null,
              // 1652397825 = 1652372625 + 25200, 25200 = 7 * 60 * 60 = 7 hours in seconds
              // This 7 hour difference is hard coded into test_all_types (value is 2022-05-12 16:23:45-07)
              timestampTZValue(1652397825n * 1000n * 1000n),
            ]),
            null,
          ]);
          // varchar_array
          assertValues(chunk, 39, DuckDBListVector, [
            listValue([]),
            // Note that the string 'goose' in varchar_array does NOT have an embedded null character.
            listValue(['🦆🦆🦆🦆🦆🦆', 'goose', null, '']),
            null,
          ]);
          // nested_int_array
          assertValues(chunk, 40, DuckDBListVector, [
            listValue([]),
            listValue([
              listValue([]),
              listValue([42, 999, null, null, -42]),
              null,
              listValue([]),
              listValue([42, 999, null, null, -42]),
            ]),
            null,
          ]);
          assertValues(chunk, 41, DuckDBStructVector, [
            structValue({ 'a': null, 'b': null }),
            structValue({ 'a': 42, 'b': '🦆🦆🦆🦆🦆🦆' }),
            null,
          ]);
          // struct_of_arrays
          assertValues(chunk, 42, DuckDBStructVector, [
            structValue({ 'a': null, 'b': null }),
            structValue({
              'a': listValue([42, 999, null, null, -42]),
              'b': listValue(['🦆🦆🦆🦆🦆🦆', 'goose', null, '']),
            }),
            null,
          ]);
          // array_of_structs
          assertValues(chunk, 43, DuckDBListVector, [
            listValue([]),
            listValue([
              structValue({ 'a': null, 'b': null }),
              structValue({ 'a': 42, 'b': '🦆🦆🦆🦆🦆🦆' }),
              null,
            ]),
            null,
          ]);
          assertValues(chunk, 44, DuckDBMapVector, [
            mapValue([]),
            mapValue([{ key: 'key1', value: '🦆🦆🦆🦆🦆🦆' }, { key: 'key2', value: 'goose' }]),
            null,
          ]);
          assertValues<DuckDBValue, DuckDBUnionVector>(chunk, 45, DuckDBUnionVector, [
            unionValue('name', 'Frank'),
            unionValue('age', 5),
            null,
          ]);
          // fixed_int_array
          assertValues(chunk, 46, DuckDBArrayVector, [
            arrayValue([null, 2, 3]),
            arrayValue([4, 5, 6]),
            null,
          ]);
          // fixed_varchar_array
          assertValues(chunk, 47, DuckDBArrayVector, [
            arrayValue(['a', null, 'c']),
            arrayValue(['d', 'e', 'f']),
            null,
          ]);
          // fixed_nested_int_array
          assertValues(chunk, 48, DuckDBArrayVector, [
            arrayValue([
              arrayValue([null, 2, 3]),
              null,
              arrayValue([null, 2, 3]),
            ]),
            arrayValue([
              arrayValue([4, 5, 6]),
              arrayValue([null, 2, 3]),
              arrayValue([4, 5, 6]),
            ]),
            null,
          ]);
          // fixed_nested_varchar_array
          assertValues(chunk, 49, DuckDBArrayVector, [
            arrayValue([
              arrayValue(['a', null, 'c']),
              null,
              arrayValue(['a', null, 'c']),
            ]),
            arrayValue([
              arrayValue(['d', 'e', 'f']),
              arrayValue(['a', null, 'c']),
              arrayValue(['d', 'e', 'f']),
            ]),
            null,
          ]);
          // fixed_struct_array
          assertValues(chunk, 50, DuckDBArrayVector, [
            arrayValue([
              structValue({ 'a': null, 'b': null }),
              structValue({ 'a': 42, 'b': '🦆🦆🦆🦆🦆🦆' }),
              structValue({ 'a': null, 'b': null }),
            ]),
            arrayValue([
              structValue({ 'a': 42, 'b': '🦆🦆🦆🦆🦆🦆' }),
              structValue({ 'a': null, 'b': null }),
              structValue({ 'a': 42, 'b': '🦆🦆🦆🦆🦆🦆' }),
            ]),
            null,
          ]);
          // struct_of_fixed_array
          assertValues(chunk, 51, DuckDBStructVector, [
            structValue({
              'a': arrayValue([null, 2, 3]),
              'b': arrayValue(['a', null, 'c']),
            }),
            structValue({
              'a': arrayValue([4, 5, 6]),
              'b': arrayValue(['d', 'e', 'f']),
            }),
            null,
          ]);
          // fixed_array_of_int_list
          assertValues(chunk, 52, DuckDBArrayVector, [
            arrayValue([
              listValue([]),
              listValue([42, 999, null, null, -42]),
              listValue([]),
            ]),
            arrayValue([
              listValue([42, 999, null, null, -42]),
              listValue([]),
              listValue([42, 999, null, null, -42]),
            ]),
            null,
          ]);
          // list_of_fixed_int_array
          assertValues(chunk, 53, DuckDBListVector, [
            listValue([
              arrayValue([null, 2, 3]),
              arrayValue([4, 5, 6]),
              arrayValue([null, 2, 3]),
            ]),
            listValue([
              arrayValue([4, 5, 6]),
              arrayValue([null, 2, 3]),
              arrayValue([4, 5, 6]),
            ]),
            null,
          ]);
        } finally {
          chunk.dispose();
        }
      } finally {
        result.dispose();
      }
    });
  });
  test('values toString', () => {
    assert.equal(arrayValue([]).toString(), '[]');
    assert.equal(arrayValue([1, 2, 3]).toString(), '[1, 2, 3]');
    assert.equal(arrayValue(['a', 'b', 'c']).toString(), `['a', 'b', 'c']`);

    assert.equal(bitValue('').toString(), '');
    assert.equal(bitValue('10101').toString(), '10101');
    assert.equal(bitValue('0010001001011100010101011010111').toString(), '0010001001011100010101011010111');

    assert.equal(DuckDBBlobValue.fromString('').toString(), '');
    assert.equal(DuckDBBlobValue.fromString('thisisalongblob\x00withnullbytes').toString(), 'thisisalongblob\\x00withnullbytes');
    assert.equal(DuckDBBlobValue.fromString('\x00\x00\x00a').toString(), '\\x00\\x00\\x00a');

    assert.equal(DuckDBDateValue.Epoch.toString(), '1970-01-01');
    assert.equal(DuckDBDateValue.Max.toString(), '5881580-07-10');
    assert.equal(DuckDBDateValue.Min.toString(), '5877642-06-25 (BC)');
  });
});
