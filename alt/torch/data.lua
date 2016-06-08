require 'torch'   -- torch
require 'image'   -- to visualize the dataset
require 'nnx'      -- provides a normalization operator

local opt = opt or {
   visualize = true,
   size = 'small',
   patches='all'
}

----------------------------------------------------------------------
print(sys.COLORS.red ..  '==> loading dataset')
-- dbfile = io.open('../database.csv')
for line in io.lines('../database.csv') do
	imageName, handX, handY = string.gmatch(line, "([^,]+),([^,]+)")
	print(line)
end

-- for f=0,28033 do
--   imagesAll[f+1] = image.load('face-dataset/bg/bg_'..f..'.png') 
--   labelsAll[f+1] = 2 -- 2 = background
-- end


local imagesAll = torch.Tensor(41267,3,80,45)
local labelsAll = torch.Tensor(41267,3)


print(imagesAll)
print(labelsAll)





-- see if the file exists
function file_exists(file)
  local f = io.open(file, "rb")
  if f then f:close() end
  return f ~= nil
end