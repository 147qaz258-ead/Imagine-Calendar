import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { FilterService, FilterOptionsResponse, ProvinceCityResponse } from './filter.service'
import { Public } from '../../common/decorators/public.decorator'

/**
 * 筛选选项控制器
 * 提供各维度的筛选选项数据
 */
@ApiTags('筛选')
@Controller('filters')
export class FilterController {
  constructor(private readonly filterService: FilterService) {}

  /**
   * 获取筛选选项
   * GET /api/filters/options
   */
  @Public()
  @Get('options')
  @ApiOperation({ summary: '获取筛选选项' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      example: {
        success: true,
        data: {
          locations: [
            { value: 'beijing', label: '北京' },
            { value: 'shanghai', label: '上海' },
          ],
          selfPositioning: [
            { value: 'technical', label: '技术' },
            { value: 'product', label: '产品' },
          ],
        },
      },
    },
  })
  getFilterOptions(): FilterOptionsResponse {
    return this.filterService.getFilterOptions()
  }

  /**
   * 获取省市联动数据
   * GET /api/filters/locations
   */
  @Public()
  @Get('locations')
  @ApiOperation({ summary: '获取省市联动数据' })
  @ApiResponse({
    status: 200,
    description: '返回省市两级联动数据',
    schema: {
      example: {
        success: true,
        data: [
          {
            name: '北京市',
            cities: [{ name: '东城区' }, { name: '西城区' }],
          },
        ],
      },
    },
  })
  getLocationsWithProvinces(): ProvinceCityResponse {
    return this.filterService.getLocationsWithProvinces()
  }
}
