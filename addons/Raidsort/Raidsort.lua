-- Raidsort WoW Addon for Classic
local MAX_GROUP_SIZE = 5
local MAX_RAID_SIZE = 8

--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
-- Lua Library inline imports
local function __TS__ObjectAssign(target, ...)
    local sources = {...}
    for i = 1, #sources do
        local source = sources[i]
        for key in pairs(source) do
            target[key] = source[key]
        end
    end
    return target
end

local function __TS__ArrayFilter(self, callbackfn, thisArg)
    local result = {}
    local len = 0
    for i = 1, #self do
        if callbackfn(thisArg, self[i], i - 1, self) then
            len = len + 1
            result[len] = self[i]
        end
    end
    return result
end

local function __TS__ArrayFindIndex(self, callbackFn, thisArg)
    for i = 1, #self do
        if callbackFn(thisArg, self[i], i - 1, self) then
            return i - 1
        end
    end
    return -1
end

local function __TS__ArrayMap(self, callbackfn, thisArg)
    local result = {}
    for i = 1, #self do
        result[i] = callbackfn(thisArg, self[i], i - 1, self)
    end
    return result
end

local function __TS__ArrayFind(self, predicate, thisArg)
    for i = 1, #self do
        local elem = self[i]
        if predicate(thisArg, elem, i - 1, self) then
            return elem
        end
    end
    return nil
end

local function __TS__ArrayIsArray(value)
    return type(value) == "table" and (value[1] ~= nil or next(value) == nil)
end

local function __TS__ArrayFlatMap(self, callback, thisArg)
    local result = {}
    local len = 0
    for i = 1, #self do
        local value = callback(thisArg, self[i], i - 1, self)
        if __TS__ArrayIsArray(value) then
            for j = 1, #value do
                len = len + 1
                result[len] = value[j]
            end
        else
            len = len + 1
            result[len] = value
        end
    end
    return result
end
-- End of Lua Library inline imports

-- RAIDSORT soul
function GetCurrentRaidInfo()
    local currRaidInfo = {}
    do
        local currRaidIndex = 1
        while currRaidIndex <= MAX_RAID_MEMBERS do
            local playerName, _, groupId = GetRaidRosterInfo(currRaidIndex)
            if playerName ~= nil then
                currRaidInfo[#currRaidInfo + 1] = {playerName = playerName, raidId = currRaidIndex, groupId = groupId}
            end
            currRaidIndex = currRaidIndex + 1
        end
    end
    return currRaidInfo
end
function getGroupIdFromRaidId(raidIdIndex)
    return math.floor((raidIdIndex - 1) / MAX_GROUP_SIZE) + 1
end
function FindAFreeGroup(raidInfo)
    do
        local i = 0
        while i < MAX_RAID_SIZE do
            local allMembersAssignedToGroup = __TS__ArrayFilter(
                raidInfo,
                function(____, t) return t.groupId == i + 1 end
            )
            if #allMembersAssignedToGroup < MAX_GROUP_SIZE then
                return i + 1
            end
            i = i + 1
        end
    end
    -- TODO There is a fix, just find whoever is in the wrong spot and swap them
    print("If the raid is full this will not work...")
    return -1
end
function SolvePlayerPosition(player, directive)
    local raidInfo = GetCurrentRaidInfo()
    local destinationGroupId = player.destinationGroupId
    local currentStatusOfPlayer = __TS__ArrayFind(
        raidInfo,
        function(____, t) return t.playerName == player.playerName end
    )
    if not currentStatusOfPlayer then
        print(("Unpexted player not found " .. player.playerName) .. ", skipping, but this should never happen.")
    end
    local existingCurrentPlayer = currentStatusOfPlayer
    if existingCurrentPlayer.groupId == destinationGroupId then
        return
    end

    local destinationGroup = __TS__ArrayFilter(
        raidInfo,
        function(____, t) return t.groupId == destinationGroupId end
    )
    if #destinationGroup >= MAX_GROUP_SIZE then
        local wronglyPlacedPlayer = __TS__ArrayFind(
            destinationGroup,
            function(____, currPlayer)
                local directivePlayer = __TS__ArrayFind(
                    directive,
                    function(____, t) return t.playerName == currPlayer.playerName end
                )
                return (directivePlayer and directivePlayer.destinationGroupId) ~= destinationGroupId
            end
        )
        if not wronglyPlacedPlayer then
            print("WE HAVE A PROBLEM!")
        end
        SetRaidSubgroup(
            wronglyPlacedPlayer.raidId,
            FindAFreeGroup(raidInfo)
        )
    end
    SetRaidSubgroup(existingCurrentPlayer.raidId, destinationGroupId)
end
function SortRaid(raid)
    local sortState = {unknownPlayers = {}, preSortState = {}}
    local flatRaid = __TS__ArrayFlatMap(
        __TS__ArrayMap(
            raid,
            function(____, t, gIdx) return __TS__ArrayMap(
                t,
                function(____, x, sIdx) return {destinationIndex = gIdx * MAX_GROUP_SIZE + sIdx + 1, name = x} end
            ) end
        ),
        function(____, t) return t end
    )
    do
        local currRaidIndex = 1
        while currRaidIndex <= MAX_RAID_MEMBERS do
            local currPlayer, _, currPlayerGroup = GetRaidRosterInfo(currRaidIndex)
            if currPlayer ~= nil then
                local foundPlayer = __TS__ArrayFind(
                    flatRaid,
                    function(____, t) return t.name == currPlayer end
                )
                if not foundPlayer then
                    local ____sortState_unknownPlayers_2 = sortState.unknownPlayers
                    ____sortState_unknownPlayers_2[#____sortState_unknownPlayers_2 + 1] = {currentIndex = currRaidIndex, playerName = currPlayer}
                else
                    local ____sortState_preSortState_3 = sortState.preSortState
                    ____sortState_preSortState_3[#____sortState_preSortState_3 + 1] = {
                        currentIndex = currRaidIndex,
                        destinationGroupId = getGroupIdFromRaidId(foundPlayer.destinationIndex),
                        playerName = currPlayer
                    }
                end
            end
            currRaidIndex = currRaidIndex + 1
        end
    end
    for ____, curr in ipairs(sortState.unknownPlayers) do
        local groupWithSmallestCount = 1
        local currSmallestCount = MAX_GROUP_SIZE
        do
            local i = 0
            while i < MAX_RAID_SIZE do
                local allMembersAssignedToGroup = __TS__ArrayFilter(
                    sortState.preSortState,
                    function(____, t) return t.destinationGroupId == i + 1 end
                )
                if #allMembersAssignedToGroup < currSmallestCount then
                    currSmallestCount = #allMembersAssignedToGroup
                    groupWithSmallestCount = i + 1
                end
                i = i + 1
            end
        end
        local ____sortState_preSortState_4 = sortState.preSortState
        ____sortState_preSortState_4[#____sortState_preSortState_4 + 1] = {currentIndex = curr.currentIndex, destinationGroupId = groupWithSmallestCount, playerName = curr.playerName}
    end
    for ____, curr in ipairs(sortState.preSortState) do
        SolvePlayerPosition(curr, sortState.preSortState)
    end
end

local Raidsort = {}
Raidsort.savedGroups = nil

-- Frame for receiving slash commands
local frame = CreateFrame("Frame")
frame:RegisterEvent("ADDON_LOADED")

-- Function to create an import window
function Raidsort:ShowImportWindow()
    local popup = CreateFrame("Frame", "RaidsortPopup", UIParent, "BasicFrameTemplateWithInset")
    popup:SetSize(400, 200)
    popup:SetPoint("CENTER")
    popup:EnableMouse(true)
    popup:SetMovable(true)
    popup:RegisterForDrag("LeftButton")
    popup:SetScript("OnDragStart", popup.StartMoving)
    popup:SetScript("OnDragStop", popup.StopMovingOrSizing)

    popup.title = popup:CreateFontString(nil, "OVERLAY", "GameFontHighlight")
    popup.title:SetPoint("TOP", popup, "TOP", 0, -5)
    popup.title:SetText("Import Group Configuration")

    local scrollFrame = CreateFrame("ScrollFrame", nil, popup, "UIPanelScrollFrameTemplate")
    scrollFrame:SetSize(360, 100)
    scrollFrame:SetPoint("TOP", popup, "TOP", 0, -40)

    local editBox = CreateFrame("EditBox", nil, scrollFrame)
    editBox:SetMultiLine(true)
    editBox:SetFontObject(ChatFontNormal)
    editBox:SetSize(340, 200)
    editBox:SetAutoFocus(true)
    editBox:SetText("")
    editBox:SetScript("OnEscapePressed", function() editBox:ClearFocus() end)
    
    scrollFrame:SetScrollChild(editBox)

    local saveButton = CreateFrame("Button", nil, popup, "GameMenuButtonTemplate")
    saveButton:SetSize(100, 30)
    saveButton:SetPoint("BOTTOMLEFT", popup, "BOTTOMLEFT", 20, 20)
    saveButton:SetText("Save")
    saveButton:SetScript("OnClick", function()
        local tableInput = editBox:GetText()
        local status, groups = pcall(function() return loadstring("return " .. tableInput)() end)
        if not status or type(groups) ~= "table" then
            print("[Raidsort]: Error: Invalid Group format.")
        else
            Raidsort.savedGroups = groups
            print("[Raidsort]: Group imported and saved.")
            popup:Hide()
        end
    end)

    local cancelButton = CreateFrame("Button", nil, popup, "GameMenuButtonTemplate")
    cancelButton:SetSize(100, 30)
    cancelButton:SetPoint("BOTTOMRIGHT", popup, "BOTTOMRIGHT", -20, 20)
    cancelButton:SetText("Cancel")
    cancelButton:SetScript("OnClick", function()
        popup:Hide()
    end)

    popup:Show()
end

-- Function to sort the raid
function Raidsort:SortRaid()
    if Raidsort.savedGroups == nil then
        print("[Raidsort]: Error: No Setup is stored!")
        return
    end

    if not UnitIsGroupAssistant("player") and not UnitIsGroupLeader("player") then
        print("[Raidsort]: You need to be a raid lead/assistant to sort it!")
        return
    end

    -- We can iterate this a few times making sure that it'll be fixed,
    -- it seems that the SetRaidSubgroup function isn't synchronous and
    -- there's a delay between calling it and getting the results.
    SortRaid(Raidsort.savedGroups);

    print("[Raidsort]: Raid sorted!")
end

-- Slash command handler
SLASH_RAIDSORT1 = "/raidsort"
function SlashCmdList.RAIDSORT(msg)
    local args = {}
    for word in msg:gmatch("%S+") do
        table.insert(args, word)
    end

    if args[1] == "import" then
        Raidsort:ShowImportWindow()
    elseif args[1] == "load" then
        Raidsort:SortRaid()
    else
        print("[Raidsort]: Usage:")
        print("  /raidsort import")
        print("  /raidsort load")
    end
end

-- Event handler
frame:SetScript("OnEvent", function(self, event, ...)
    if event == "ADDON_LOADED" then
        local addonName = ...
        if addonName == "Raidsort" then
            print("[Raidsort]: Addon loaded. Use /raidsort to manage raid groups.")
        end
    end
end)
